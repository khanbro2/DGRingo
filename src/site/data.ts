/**
 * Marketing content for the DGRINGO site. Kept in one place so copy/pricing can
 * be tuned without touching layout. `shot` paths point at /public/shots/*.png —
 * real app captures (see scripts that screenshot the running app).
 */

export const NAV = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

export const COUNTRIES = [
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇧🇷", name: "Brazil" },
  { flag: "🇯🇵", name: "Japan" },
];

export const STATS = [
  { num: "8+", label: "Countries with local numbers" },
  { num: "60s", label: "From sign-up to your first number" },
  { num: "$1", label: "Numbers starting per month" },
  { num: "100%", label: "App-based — no SIM, no contract" },
];

export const FEATURES = [
  {
    icon: "Hash",
    title: "Real local numbers",
    body: "Get genuine local phone numbers in 8+ countries. They look and ring exactly like a native line — because they are one.",
  },
  {
    icon: "MessageSquare",
    title: "SMS that just works",
    body: "Send and receive texts with delivery receipts, per-number inboxes and threaded conversations — all from one screen.",
  },
  {
    icon: "PhoneCall",
    title: "Crystal-clear calls",
    body: "Place and take HD calls over the internet. Pick which of your numbers you call from with a single tap.",
  },
  {
    icon: "Wallet",
    title: "Prepaid wallet",
    body: "Top up once and spend as you go. No surprise invoices — see every charge in a clean, itemised history.",
  },
  {
    icon: "ShieldCheck",
    title: "Trust center",
    body: "Register your numbers for business messaging and stay compliant with 10DLC and carrier requirements, guided step by step.",
  },
  {
    icon: "Globe",
    title: "Borderless by design",
    body: "Keep a US line for work, a UK line for family and more — all in one app, no extra device or SIM required.",
  },
];

export const STEPS = [
  { n: "01", title: "Create your account", body: "Sign up in under a minute. No paperwork, no store visit." },
  { n: "02", title: "Pick a number", body: "Browse live local & mobile numbers and choose the one you like." },
  { n: "03", title: "Top up your wallet", body: "Add credit securely with PayPal — pay only for what you use." },
  { n: "04", title: "Call & text away", body: "Your new number is live instantly. Start messaging and calling." },
];

export const PRICING = [
  {
    name: "Starter",
    price: "0",
    suffix: "/mo",
    tagline: "Pay only for the numbers you buy.",
    cta: "Get started",
    featured: false,
    features: [
      "1 active number",
      "Local numbers from $1/mo",
      "Pay-as-you-go SMS & calls",
      "Prepaid wallet (PayPal top-up)",
      "Single shared inbox",
    ],
  },
  {
    name: "Pro",
    price: "9",
    suffix: "/mo",
    tagline: "For freelancers & growing teams.",
    cta: "Start Pro",
    featured: true,
    features: [
      "Up to 10 active numbers",
      "Per-number inboxes & contacts",
      "Trust center 10DLC registration",
      "Priority message delivery",
      "Call & SMS history exports",
      "Email support",
    ],
  },
  {
    name: "Business",
    price: "29",
    suffix: "/mo",
    tagline: "Scale across countries & teammates.",
    cta: "Contact sales",
    featured: false,
    features: [
      "Unlimited numbers",
      "8+ countries incl. mobile SMS",
      "Team seats & roles",
      "Advanced analytics dashboard",
      "Webhooks & API access",
      "Dedicated support",
    ],
  },
];

export const FAQS = [
  {
    q: "What exactly is DGRINGO?",
    a: "DGRINGO is an app that gives you real local phone numbers in multiple countries. You can call and text from them just like a normal SIM line — but everything lives in one simple app, with no physical SIM or contract.",
  },
  {
    q: "Do I need a SIM card or a second phone?",
    a: "No. DGRINGO works entirely over the internet on the phone you already own. Add as many numbers as you like without swapping SIMs or carrying another device.",
  },
  {
    q: "Which countries are available?",
    a: "You can get local numbers in the US, UK, Canada, Australia, Germany, France, Brazil and more — with new countries added regularly. Some countries offer mobile numbers for full SMS support.",
  },
  {
    q: "How does billing work?",
    a: "DGRINGO uses a prepaid wallet. You top up securely with PayPal and your balance is used for your monthly numbers, calls and texts. You always see a clear, itemised history of every charge.",
  },
  {
    q: "Can I send business SMS?",
    a: "Yes. The built-in Trust Center walks you through registering your numbers (10DLC and carrier requirements) so your business messages are delivered reliably and stay compliant.",
  },
  {
    q: "Is it available on iPhone and Android?",
    a: "DGRINGO is built cross-platform and ships to both iOS and Android, with the same clean experience on every device.",
  },
];

/** Real app captures — see /public/shots. PhoneFrame falls back gracefully. */
export const SHOTS = {
  home: "/shots/home.png",
  numbers: "/shots/numbers.png",
  buy: "/shots/buy.png",
  inbox: "/shots/inbox.png",
  chat: "/shots/chat.png",
  calls: "/shots/calls.png",
  dialer: "/shots/dialer.png",
  wallet: "/shots/wallet.png",
  settings: "/shots/settings.png",
  activity: "/shots/activity.png",
};
