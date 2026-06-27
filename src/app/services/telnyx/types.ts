/**
 * Telnyx v2 API types — mirror the real resource shapes returned by
 * https://api.telnyx.com/v2 (verified against Telnyx's OpenAPI spec).
 *
 * These are the WIRE types. The app's own domain types (core/types.ts) are
 * mapped from these in `adapt.ts`, so screens never depend on Telnyx directly.
 */

/* envelopes */
export interface TList<T> { data: T[]; meta?: TMeta; }
export interface TSingle<T> { data: T; }
export interface TMeta { total_pages?: number; total_results?: number; page_number?: number; page_size?: number; }

export interface TCost { upfront_cost?: string; monthly_cost?: string; currency: string; }
export interface TFeature { name: string; }
export interface TRegionInfo { region_type: string; region_name: string; }

/* §2 available numbers (search) */
export interface AvailablePhoneNumber {
  record_type: "available_phone_number";
  phone_number: string;
  vanity_format?: string;
  best_effort: boolean;
  quickship: boolean;
  reservable: boolean;
  region_information: TRegionInfo[];
  cost_information: TCost;
  features: TFeature[];
}

/* §3 number orders */
export interface NumberOrder {
  id: string;
  record_type: "number_order";
  status: "pending" | "success" | "failure";
  phone_numbers_count: number;
  messaging_profile_id?: string;
  connection_id?: string;
  phone_numbers: Array<{ id: string; phone_number: string; phone_number_type?: string; status: string }>;
  created_at?: string;
}

/* §4 owned numbers — status uses HYPHENS (active, purchase-pending…) */
export type PhoneNumberStatus =
  | "active" | "purchase-pending" | "purchase-failed" | "port-pending"
  | "provision-pending" | "emergency-only" | "deleted";

export interface PhoneNumberDetailed {
  id: string;
  record_type: "phone_number";
  phone_number: string;
  country_iso_alpha2: string;
  status: PhoneNumberStatus;
  connection_id?: string;
  connection_name?: string;
  messaging_profile_id?: string;
  billing_group_id?: string;
  tags?: string[];
  phone_number_type?: "local" | "toll_free" | "mobile" | "national";
  purchased_at?: string;
  created_at?: string;
  updated_at?: string;
}

/* §5 messaging */
export interface Message {
  id: string;
  record_type: "message";
  direction: "outbound" | "inbound";
  type: "SMS" | "MMS";
  messaging_profile_id?: string;
  from: { phone_number: string; carrier?: string; line_type?: string };
  to: Array<{ phone_number: string; status: MessageStatus; carrier?: string; line_type?: string }>;
  text: string;
  parts?: number;
  cost?: { amount: string; currency: string } | null;
  received_at?: string;
  sent_at?: string;
  completed_at?: string;
}
export type MessageStatus =
  | "queued" | "sending" | "sent" | "delivered"
  | "sending_failed" | "delivery_failed" | "delivery_unconfirmed" | "expired";

/**
 * Backend messaging store. Telnyx has NO "list conversations" endpoint — your
 * backend receives inbound SMS via the `message.received` webhook, stores
 * outbound + inbound messages, and groups them into threads per (owned number,
 * contact). These are YOUR backend's shapes, fed by Telnyx.
 */
export interface ThreadMessage {
  id: string;                      // Telnyx message id
  direction: "inbound" | "outbound";
  text: string;
  status: MessageStatus;
  time: string;
}
export interface ConversationThread {
  id: string;
  phone_number_id: string;         // owned number id this inbox belongs to
  contact: string;                 // external party E.164 (or display)
  contact_flag: string;
  unread: number;
  time: string;                    // last activity, display
  messages: ThreadMessage[];
}

/* Messaging profile (number ↔ messaging config) */
export interface MessagingProfile {
  id: string;
  record_type: "messaging_profile";
  name: string;
  enabled: boolean;
  webhook_url?: string;
}

/* §6 10DLC — the US A2P registration ("verification") gate */
export type BrandStatus = "PENDING" | "VERIFIED" | "UNVERIFIED" | "FAILED";
export interface Brand {
  brandId: string;
  tcrBrandId?: string;
  displayName: string;
  companyName?: string;
  entityType: string;     // PRIVATE_PROFIT | SOLE_PROPRIETOR | …
  status: BrandStatus;
}
export type CampaignStatus = "TCR_PENDING" | "TCR_ACCEPTED" | "ACTIVE" | "FAILED";
export interface Campaign {
  campaignId: string;
  tcrCampaignId?: string;
  brandId: string;
  usecase: string;        // MIXED | MARKETING | 2FA | ACCOUNT_NOTIFICATION …
  status: CampaignStatus;
}
export type AssignmentStatus = "PENDING_ASSIGNMENT" | "ASSIGNED" | "FAILED_ASSIGNMENT";
export interface PhoneNumberCampaign {
  phoneNumber: string;
  campaignId: string;
  status: AssignmentStatus;
}

/* §7 Verify API (OTP) */
export interface Verification {
  id: string;
  phone_number: string;
  type: "sms";
  verify_profile_id: string;
  status: "pending" | "accepted" | "rejected";
}
export interface VerifyResult { phone_number: string; response_code: "accepted" | "rejected"; }

/* §8 voice */
export interface Call {
  record_type: "call";
  call_control_id: string;
  call_leg_id: string;
  call_session_id: string;
  is_alive: boolean;
}
export interface DetailRecord {
  id: string;
  record_type: string;      // "call-control", "conference"…
  direction?: "incoming" | "outgoing";
  from?: string;
  to?: string;
  duration_secs?: number;
  cost?: string;
  status?: string;
  started_at?: string;
}

/* §9 balance (account-level — Telnyx has NO per-number balance) */
export interface Balance {
  record_type: "balance";
  balance: string;
  credit_limit: string;
  available_credit: string;
  pending: string;
  currency: string;
}
