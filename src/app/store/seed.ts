import type {
  AppState, PhoneNumber, Conversation, CallLog, ActivityItem, WalletTxn,
} from "../core/types";
import { TELNYX_MODE } from "../services/telnyx/config";

// In LIVE mode the app starts empty and everything loads from Telnyx on login,
// so no demo/seed data is shown. In mock mode we keep the seed for UI demos.
const LIVE = TELNYX_MODE === "live";

const ns = (over: Partial<PhoneNumber["settings"]> = {}) => ({
  label: "", icon: "📱", businessHours: false, autoRecord: false,
  transcripts: false, forwardAll: false, muted: false, showInRecent: true,
  ringtone: "Default", ...over,
});

export const SEED_NUMBERS: PhoneNumber[] = [
  { id: "n1", flag: "🇺🇸", number: "+1 (415) 555-0182", country: "United States", sms: true, voice: true, price: 2.99, verification: "verified",   settings: ns({ label: "Support Line",  icon: "🚌", autoRecord: true, transcripts: true }) },
  { id: "n2", flag: "🇬🇧", number: "+44 7700 900142",   country: "United Kingdom", sms: true, voice: false, price: 3.49, verification: "unverified", settings: ns({ label: "Inbound Team",  icon: "📨" }) },
  { id: "n3", flag: "🇩🇪", number: "+49 30 901820",     country: "Germany",        sms: true, voice: true, price: 4.99, verification: "verified",   settings: ns({ label: "Digital Atlas", icon: "🌐" }) },
  { id: "n4", flag: "🇫🇷", number: "+33 1 70 18 99 00", country: "France",         sms: true, voice: false, price: 3.99, verification: "pending",    settings: ns({ label: "Outbound",      icon: "✨" }) },
  { id: "n5", flag: "🇨🇦", number: "+1 (778) 555-0199", country: "Canada",         sms: true, voice: true, price: 2.49, verification: "unverified", settings: ns({ label: "Victor",        icon: "📞" }) },
  { id: "n6", flag: "🇯🇵", number: "+81 3-1234-5678",   country: "Japan",          sms: false, voice: true, price: 5.99, verification: "verified",   settings: ns({ label: "Tokyo Desk",    icon: "🗼" }) },
  { id: "n7", flag: "🇦🇺", number: "+61 2 9876 5432",   country: "Australia",      sms: true, voice: true, price: 4.49, verification: "unverified", settings: ns({ label: "MATT",          icon: "👑" }) },
];

export const SEED_CONVOS: Conversation[] = [
  { id: "c1", numberId: "n1", contactFlag: "🇺🇸", contact: "+1 (847) 793-1243", preview: "Your verification code is 847291", time: "2m", unread: 3, messages: [
    { id: "m1", text: "Hi, I need help verifying my account.", sent: true,  time: "10:21 AM" },
    { id: "m2", text: "Your verification code is 847291",       sent: false, time: "10:22 AM" },
    { id: "m3", text: "Thank you so much!",                      sent: true,  time: "10:23 AM" },
    { id: "m4", text: "This code expires in 10 minutes.",        sent: false, time: "10:23 AM" },
  ]},
  { id: "c2", numberId: "n1", contactFlag: "🇺🇸", contact: "+1 (307) 433-8101", preview: "Call ended",                       time: "Jun 4", unread: 0, messages: [
    { id: "m1", text: "Are you available for a quick call?", sent: false, time: "9:00 AM" },
    { id: "m2", text: "Sure, calling now.",                   sent: true,  time: "9:01 AM" },
  ]},
  { id: "c3", numberId: "n2", contactFlag: "🇬🇧", contact: "+44 7700 118822", preview: "Hello! Is this still available?", time: "14m", unread: 1, messages: [
    { id: "m1", text: "Hello! Is this number still available?", sent: false, time: "9:46 AM" },
    { id: "m2", text: "Yes, it's active!",                       sent: true,  time: "9:48 AM" },
  ]},
  { id: "c4", numberId: "n3", contactFlag: "🇩🇪", contact: "+49 151 23456789", preview: "Danke für Ihre Bestellung!", time: "1h", unread: 0, messages: [
    { id: "m1", text: "Danke für Ihre Bestellung!", sent: false, time: "9:05 AM" },
  ]},
  { id: "c5", numberId: "n5", contactFlag: "🇨🇦", contact: "+1 (778) 200-7788", preview: "Meeting confirmed for tomorrow", time: "5h", unread: 0, messages: [
    { id: "m1", text: "Can we confirm meeting tomorrow at 3pm?", sent: true,  time: "5:00 AM" },
    { id: "m2", text: "Meeting confirmed for tomorrow at 3pm.",  sent: false, time: "5:12 AM" },
  ]},
];

export const SEED_CALLS: CallLog[] = [
  { id: "k1", numberId: "n1", contactFlag: "🇺🇸", contact: "+1 (847) 793-1243", direction: "incoming", status: "Call ended",   duration: "4:12", time: "Tue"   },
  { id: "k2", numberId: "n1", contactFlag: "🇺🇸", contact: "+1 (307) 433-8101", direction: "outgoing", status: "Call ended",   duration: "1:38", time: "Jun 4" },
  { id: "k3", numberId: "n1", contactFlag: "🇺🇸", contact: "+1 (307) 632-1553", direction: "missed",   status: "Missed call",   duration: "",     time: "Jun 4" },
  { id: "k4", numberId: "n3", contactFlag: "🇩🇪", contact: "+49 151 23456789",  direction: "outgoing", status: "Call ended",   duration: "0:46", time: "Jun 3" },
  { id: "k5", numberId: "n1", contactFlag: "🇺🇸", contact: "+1 (307) 773-3838", direction: "incoming", status: "Voicemail",     duration: "0:21", time: "Jun 2" },
  { id: "k6", numberId: "n6", contactFlag: "🇯🇵", contact: "+81 90-1234-5678",  direction: "outgoing", status: "Call ended",   duration: "8:05", time: "Jun 1" },
];

export const SEED_ACTIVITY: ActivityItem[] = [
  { id: "a1", kind: "system",       title: "Push notifications restricted", body: "We are unable to alert you of incoming messages when the app is not active.", time: "Yesterday, 12:11 AM", read: false },
  { id: "a2", kind: "message",      title: "New message",        body: "+1 (847) 793-1243 sent you a verification code.", time: "2m ago",  read: false },
  { id: "a3", kind: "verification", title: "Number verified",    body: "+1 (415) 555-0182 is now registered and can send SMS.", time: "1h ago", read: true },
  { id: "a4", kind: "wallet",       title: "Top-up successful",  body: "$20.00 added to your wallet.", time: "Jun 4", read: true },
];

export const SEED_TXNS: WalletTxn[] = [
  { id: "t1", label: "Wallet top-up",            amount:  20.00, time: "Jun 4"  },
  { id: "t2", label: "Number +1 (415) 555-0182", amount:  -2.99, time: "Jun 1"  },
  { id: "t3", label: "SMS bundle",               amount:  -3.50, time: "May 28" },
  { id: "t4", label: "Wallet top-up",            amount:  10.99, time: "May 20" },
];

export const initialState: AppState = {
  user: null,
  brand: null,
  numbers: LIVE ? [] : SEED_NUMBERS,
  conversations: LIVE ? [] : SEED_CONVOS,
  calls: LIVE ? [] : SEED_CALLS,
  activity: LIVE ? [] : SEED_ACTIVITY,
  wallet: { balance: LIVE ? 0 : 24.5, txns: LIVE ? [] : SEED_TXNS },
  preferences: {
    smsAlerts: true, callAlerts: true, lowBalance: true, marketing: false, push: true,
    sounds: true, readReceipts: true, enterToSend: false, compact: false,
  },
  blocked: LIVE ? [] : ["+1 (900) 555-0142", "+1 (888) 200-1199"],
  activeNumberId: LIVE ? null : "n1",
};
