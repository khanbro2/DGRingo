/**
 * TelnyxService — the single entry point the app uses. In "mock" mode it
 * returns realistic data with no backend; in "live" mode it calls your
 * backend proxy (which injects the secret key) using the real Telnyx paths.
 */
import { TELNYX_MODE, DEFAULT_MESSAGING_PROFILE_ID, DEFAULT_CONNECTION_ID, API_BASE } from "./config";
import { http } from "./client";
import { mock } from "./mock";
import type {
  AvailablePhoneNumber, NumberOrder, PhoneNumberDetailed, Message,
  Brand, BrandStatus, Campaign, PhoneNumberCampaign, Call, Balance,
  ConversationThread, MessagingProfile, DetailRecord, MessageStatus,
  TList, TSingle,
} from "./types";
import type { BrandRegistration, CampaignRegistration, RegulatoryRequirement } from "../../core/types";

const live = TELNYX_MODE === "live";

/** Strip formatting so a phone is strict +E.164 (Telnyx rejects "+1 555 123 4567"). */
const toE164 = (s: string): string => {
  const d = (s || "").replace(/[^\d+]/g, "");
  return d.startsWith("+") ? d : `+${d}`;
};

/** Map Telnyx's raw brand status ("OK", "REGISTRATION_PENDING", …) onto the app's
 *  normalized BrandStatus. Telnyx uses "OK" for a registered brand — the app was
 *  checking for "VERIFIED" and so never unlocked the next step. */
const mapBrandStatus = (s: string | undefined, identity?: string): BrandStatus => {
  const v = String(s || "").toUpperCase();
  const id = String(identity || "").toUpperCase();
  if (v === "OK" || v === "VERIFIED" || id === "VERIFIED" || id === "VETTED_VERIFIED") return "VERIFIED";
  if (v.includes("PENDING")) return "PENDING";
  if (v.includes("FAIL")) return "FAILED";
  return "UNVERIFIED";
};

export interface SearchFilter {
  country_code?: string;
  national_destination_code?: string;
  features?: string[];
  limit?: number;
  phone_number_type?: "local" | "toll_free" | "mobile" | "national";
}

export const telnyx = {
  mode: TELNYX_MODE,

  /* §2 search available numbers */
  async searchAvailable(f: SearchFilter): Promise<AvailablePhoneNumber[]> {
    if (!live) return mock.searchAvailable(f);
    const r = await http<TList<AvailablePhoneNumber>>("/available_phone_numbers", { query: {
      "filter[country_code]": f.country_code,
      "filter[national_destination_code]": f.national_destination_code,
      "filter[features]": f.features,
      "filter[limit]": f.limit,
      "filter[phone_number_type]": f.phone_number_type,
    }});
    return r.data;
  },

  /* §3 buy */
  async createNumberOrder(phoneNumbers: string[]): Promise<NumberOrder> {
    if (!live) return mock.createNumberOrder(phoneNumbers);
    const r = await http<TSingle<NumberOrder>>("/number_orders", { method: "POST", body: {
      phone_numbers: phoneNumbers.map((phone_number) => ({ phone_number })),
      messaging_profile_id: DEFAULT_MESSAGING_PROFILE_ID,
      connection_id: DEFAULT_CONNECTION_ID,
    }});
    return r.data;
  },

  /* §4 owned numbers */
  async listPhoneNumbers(): Promise<PhoneNumberDetailed[]> {
    if (!live) return mock.listPhoneNumbers();
    const r = await http<TList<PhoneNumberDetailed>>("/phone_numbers");
    return r.data;
  },

  /* §5 messaging — inbox (conversations are a backend aggregation of Telnyx
     sent messages + inbound `message.received` webhooks) */
  async listConversations(): Promise<ConversationThread[]> {
    if (!live) return mock.listConversations();
    const r = await http<TList<ConversationThread>>("/messaging/conversations");
    return r.data;
  },
  async listMessagingProfiles(): Promise<MessagingProfile[]> {
    if (!live) return mock.listMessagingProfiles();
    const r = await http<TList<MessagingProfile>>("/messaging_profiles");
    return r.data;
  },
  async sendMessage(from: string, to: string, text: string): Promise<Message> {
    if (!live) return mock.sendMessage({ from, to, text });
    const r = await http<TSingle<Message>>("/messages", { method: "POST", body: {
      from, to, text, messaging_profile_id: DEFAULT_MESSAGING_PROFILE_ID,
    }});
    return r.data;
  },
  async getMessageStatus(id: string): Promise<MessageStatus> {
    if (!live) return mock.getMessageStatus(id);
    const r = await http<TSingle<Message>>(`/messages/${id}`);
    return r.data.to[0]?.status ?? "sent";
  },

  /* call history (CDRs) for the calls log */
  async listDetailRecords(): Promise<DetailRecord[]> {
    if (!live) return mock.listDetailRecords();
    const r = await http<TList<DetailRecord>>("/detail_records", { query: { "filter[record_type]": "call-control" } });
    return r.data;
  },

  /* number settings sync (sub-resources) */
  async updateNumberMessaging(id: string, messagingProfileId: string): Promise<unknown> {
    if (!live) return mock.updateNumberMessaging(id, messagingProfileId);
    return http(`/phone_numbers/${id}/messaging`, { method: "PATCH", body: { messaging_profile_id: messagingProfileId } });
  },
  async updateNumberVoice(id: string, settings: Record<string, unknown>): Promise<unknown> {
    if (!live) return mock.updateNumberVoice(id, settings);
    return http(`/phone_numbers/${id}/voice`, { method: "PATCH", body: settings });
  },

  /* §6 10DLC verification */
  async getBrand(): Promise<Brand | null> {
    if (!live) return mock.getBrand();
    const r = await http<TList<Brand>>("/10dlc/brand");
    const b = r.data[0];
    if (!b) return null;
    return { ...b, status: mapBrandStatus(b.status, (b as { identityStatus?: string }).identityStatus) };
  },
  // Register the 10DLC brand from the full business profile (A2P "KYC"). Telnyx
  // validates the EIN / registration number against business records — there is
  // no document upload for 10DLC.
  async registerBrand(data: BrandRegistration): Promise<Brand> {
    if (!live) return mock.registerBrand(data.displayName, data.entityType);
    const sole = data.entityType === "SOLE_PROPRIETOR";
    const isPublic = data.entityType === "PUBLIC_PROFIT";
    const r = await http<TSingle<Brand>>("/10dlc/brand", { method: "POST", body: {
      entityType: data.entityType,
      displayName: data.displayName,
      companyName: data.companyName,
      // Sole proprietors have no EIN; every other entity must supply it + its
      // issuing country (TCR matches both against the CP-575 record).
      ein: sole ? undefined : data.ein,
      einIssuingCountry: sole ? undefined : (data.einIssuingCountry || data.country),
      vertical: data.vertical,
      email: data.email,
      phone: toE164(data.phone), // Telnyx requires strict +E.164 (no spaces/dashes)
      website: data.website || undefined,
      street: data.street,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      // Publicly-traded brands must give a ticker + exchange TCR can confirm.
      stockSymbol: isPublic ? data.stockSymbol || undefined : undefined,
      stockExchange: isPublic ? data.stockExchange || undefined : undefined,
    }});
    return { ...r.data, status: mapBrandStatus(r.data.status, (r.data as { identityStatus?: string }).identityStatus) };
  },
  async createCampaign(brandId: string, data: CampaignRegistration): Promise<Campaign> {
    if (!live) return mock.createCampaign(data.usecase);
    const r = await http<TSingle<Campaign>>("/10dlc/campaignBuilder", { method: "POST", body: {
      brandId,
      usecase: data.usecase,
      description: data.description,
      messageFlow: data.messageFlow,
      sample1: data.sample1,
      sample2: data.sample2 || undefined,
      // Consent flags are always on; the keywords/auto-replies come from the form.
      subscriberOptin: true, subscriberOptout: true, subscriberHelp: true,
      optinKeywords: data.optinKeywords || undefined,
      optinMessage: data.optinMessage || undefined,
      optoutKeywords: data.optoutKeywords || undefined,
      optoutMessage: data.optoutMessage || undefined,
      helpKeywords: data.helpKeywords || undefined,
      helpMessage: data.helpMessage || undefined,
      // Content attributes carriers screen for.
      embeddedLink: data.embeddedLink,
      embeddedPhone: data.embeddedPhone,
      ageGated: data.ageGated,
      directLending: data.directLending,
      affiliateMarketing: data.affiliateMarketing,
    }});
    return r.data;
  },
  async assignNumber(phoneNumber: string, campaignId: string): Promise<PhoneNumberCampaign> {
    if (!live) return mock.assignNumber(phoneNumber);
    const r = await http<TSingle<PhoneNumberCampaign>>("/10dlc/phone_number_campaigns", { method: "POST", body: {
      phoneNumber, campaignId,
    }});
    return r.data;
  },

  /** Mark a conversation thread's inbound messages as read (server-side). */
  async markConversationRead(owned: string, contact: string): Promise<void> {
    if (!live) return;
    await http("/messaging/read", { method: "POST", body: { owned, contact } });
  },

  /* §7 number regulatory requirements (KYC documents for some countries) */
  async getNumberRequirements(phoneNumber: string): Promise<RegulatoryRequirement[]> {
    if (!live) return mock.getNumberRequirements(phoneNumber);
    // Telnyx returns the document/address/field requirements for this number's
    // country + type; we adapt the raw records into a tidy checklist.
    const r = await http<TList<Record<string, unknown>>>(
      `/phone_number_regulatory_requirements?filter[phone_number]=${encodeURIComponent(phoneNumber)}`
    );
    const reqs = (r.data?.[0]?.regulatory_requirements as Record<string, unknown>[]) ?? [];
    return reqs.map((q, i) => ({
      id: String(q.field_type ?? q.requirement_id ?? i),
      name: String(q.label ?? q.name ?? "Requirement"),
      description: String(q.description ?? ""),
      type: (q.field_type === "document" ? "document" : q.field_type === "address" ? "address" : "field") as RegulatoryRequirement["type"],
      required: true,
    }));
  },
  // Upload a regulatory document for a number. The raw file bytes are POSTed to
  // our backend (/api/telnyx/documents), which wraps them in multipart and
  // forwards to Telnyx /documents with the secret key, returning the document id.
  async submitRegulatoryDoc(phoneNumber: string, requirementId: string, file: File): Promise<{ ok: boolean; documentId?: string }> {
    if (!live) return mock.submitRegulatoryDoc(phoneNumber, requirementId, file.name);
    const token = (() => { try { return localStorage.getItem("dg-token"); } catch { return null; } })();
    const r = await fetch(`${API_BASE}/documents?filename=${encodeURIComponent(file.name)}`, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: file,
    });
    const j = await r.json().catch(() => ({} as Record<string, unknown>));
    if (!r.ok) throw new Error((j as { errors?: { detail?: string }[] }).errors?.[0]?.detail || "Document upload failed");
    return { ok: true, documentId: (j as { data?: { id?: string } }).data?.id };
  },

  /* §8 place a call */
  async createCall(to: string, from: string): Promise<Call> {
    if (!live) return mock.createCall(to, from);
    const r = await http<TSingle<Call>>("/calls", { method: "POST", body: {
      connection_id: DEFAULT_CONNECTION_ID, to, from,
    }});
    return r.data;
  },

  /* §9 account balance */
  async getBalance(): Promise<Balance> {
    if (!live) return mock.getBalance();
    const r = await http<TSingle<Balance>>("/balance");
    return r.data;
  },
};

export type { AvailablePhoneNumber, PhoneNumberDetailed, Brand, Campaign, Balance } from "./types";
