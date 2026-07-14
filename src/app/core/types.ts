/**
 * Domain types — the shared vocabulary of the app.
 *
 * Pure data shapes, no UI. Reused unchanged across web / Android / iOS.
 */

export type ISOCountry =
  | "United States" | "United Kingdom" | "Germany"
  | "France" | "Canada" | "Japan" | "Australia" | "Brazil";

/** Registration / verification state of a number (the Trust-center flow). */
export type VerificationStatus = "unverified" | "pending" | "verified";

export interface PhoneNumber {
  id: string;
  flag: string;
  number: string;
  country: ISOCountry;
  sms: boolean;
  voice: boolean;
  price: number;          // monthly price
  verification: VerificationStatus;
  /** Per-number settings (Quo-style "number action" screen). */
  settings: NumberSettings;
}

export interface NumberSettings {
  label: string;          // friendly inbox name e.g. "Support Line"
  icon: string;           // emoji icon
  businessHours: boolean;
  autoRecord: boolean;
  transcripts: boolean;
  forwardAll: boolean;
  muted: boolean;
  showInRecent: boolean;
  ringtone: string;
}

/** Mirrors Telnyx message delivery lifecycle (`to[].status`). */
export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "failed";

export interface Message {
  id: string;
  text: string;
  sent: boolean;          // true = outbound (sent by the user)
  time: string;
  status?: MessageDeliveryStatus;  // outbound only — from Telnyx DLR
  telnyxId?: string;               // Telnyx message id once submitted
}

/** A conversation with an external contact, scoped to one owned number. */
export interface Conversation {
  id: string;
  numberId: string;       // which owned number this inbox belongs to
  contactFlag: string;
  contact: string;        // the external party's number
  preview: string;
  time: string;
  unread: number;
  messages: Message[];
}

export type CallDirection = "incoming" | "outgoing" | "missed";

/** A call history entry, scoped to one owned number. */
export interface CallLog {
  id: string;
  numberId: string;       // which owned number placed/received the call
  contactFlag: string;
  contact: string;        // the external party's number
  direction: CallDirection;
  status: string;         // "Call ended", "Missed", "Voicemail"…
  duration: string;       // "2:14" or "" for missed
  time: string;
}

export type ActivityKind =
  | "message" | "system" | "wallet" | "number" | "verification" | "call";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface WalletTxn {
  id: string;
  label: string;
  amount: number;         // + top-up, - spend
  time: string;
}

/** The workspace's active bundle (null = pay-as-you-go, no bundle). */
export interface Subscription {
  tier: string;                       // "starter" | "business" | "pro"
  cycle: "monthly" | "annual";
  minutesIncluded: number;
  smsIncluded: number;
  minutesUsed: number;
  smsUsed: number;
  status: string;                     // "active" | "past_due" | "expired" | ...
  periodEnd: number;                  // epoch ms when the current period ends
  payMethod: "wallet" | "card";       // how the plan was paid for
  autoRenew: boolean;                 // renews from the wallet each cycle
  renewAmount: number;                // amount charged on renewal
  numbersUsed: number;                // numbers currently held on the plan
  numbersIncluded: number;            // free numbers included (first is free)
  numbersMax: number;                 // total numbers the plan can hold
}

export interface User {
  id: string;
  name: string;
  email: string;
  workspace: string;
  initial: string;
  phone?: string;
  company?: string;
  /** Whether the account's email has been confirmed via the verification link. */
  emailVerified?: boolean;
}

/** App + notification preferences (toggled from Settings sub-screens). */
export interface Preferences {
  // notifications
  smsAlerts: boolean;
  callAlerts: boolean;
  lowBalance: boolean;
  marketing: boolean;
  push: boolean;
  // app behaviour
  sounds: boolean;
  readReceipts: boolean;
  enterToSend: boolean;
  compact: boolean;
}

/** Account-level 10DLC brand state (Telnyx A2P registration). */
export interface BrandInfo {
  id: string;
  displayName: string;
  status: "PENDING" | "VERIFIED" | "UNVERIFIED" | "FAILED";
  campaignId?: string;
}

/** Business details collected for 10DLC brand registration — the A2P "KYC". No
 *  document upload: carriers validate the EIN/registration number automatically. */
export interface BrandRegistration {
  entityType: "PRIVATE_PROFIT" | "PUBLIC_PROFIT" | "NON_PROFIT" | "GOVERNMENT" | "SOLE_PROPRIETOR";
  displayName: string;
  companyName: string;
  ein: string;          // Tax ID / EIN (or local business registration number)
  vertical: string;     // industry vertical
  email: string;
  phone: string;        // E.164 contact number
  website: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;      // ISO-2
}

/** Campaign details for 10DLC (use case + consent + sample messages). */
export interface CampaignRegistration {
  usecase: string;
  description: string;
  sample1: string;
  sample2: string;
  messageFlow: string;  // how subscriber consent (opt-in) is collected
}

/** A document a number's country regulations require (KYC for the number). */
export interface RegulatoryRequirement {
  id: string;
  name: string;          // e.g. "Proof of ID", "Proof of address"
  description: string;
  type: "document" | "address" | "field";
  required: boolean;
}

export interface AppState {
  user: User | null;
  /** 10DLC brand for the workspace (null until registered). */
  brand: BrandInfo | null;
  numbers: PhoneNumber[];
  conversations: Conversation[];
  calls: CallLog[];
  activity: ActivityItem[];
  wallet: { balance: number; txns: WalletTxn[] };
  /** Active bundle for the workspace, or null when on pay-as-you-go. */
  subscription: Subscription | null;
  preferences: Preferences;
  /** Blocked external numbers. */
  blocked: string[];
  /** Currently selected inbox/number id for the number-wise inbox view. */
  activeNumberId: string | null;
}
