// All figures are simulated, illustrative examples. Saltbush & Ridge is a fictional company.

export const COMPANY = "Saltbush & Ridge";
export const DOMAIN = "saltbushandridge.com.au";
export const COMPANY_BLURB =
  "Australian outdoor and camping brand. 38 years old, 14 stores, and an online store that now does 46% of revenue.";

export const PRODUCT_PATH = "/products/kosciuszko-2p-tent";
export const PRODUCT_URL = `https://${DOMAIN}${PRODUCT_PATH}`;

// Share of storefront sessions that arrive from an AI assistant, by month (simulated)
export const AGENT_SHARE = [
  { m: "Apr", pct: 2.1 },
  { m: "May", pct: 3.4 },
  { m: "Jun", pct: 4.8 },
  { m: "Jul", pct: 6.9 },
  { m: "Aug", pct: 8.7 },
  { m: "Sep", pct: 11.2 },
];

export const MONTHLY_SESSIONS = 164_300;
export const AGENT_SESSIONS = 18_400; // ≈ 11.2% of monthly sessions
export const HUMAN_CONVERSION = 3.2; // %
export const AGENT_CONVERSION_BEFORE = 0.9; // %
export const AGENT_CONVERSION_AFTER = 3.4; // %
export const AOV = 212; // AUD
export const AGENT_ORDERS_BEFORE = Math.round((AGENT_SESSIONS * AGENT_CONVERSION_BEFORE) / 100); // 166
export const AGENT_ORDERS_AFTER = Math.round((AGENT_SESSIONS * AGENT_CONVERSION_AFTER) / 100); // 626
export const EXTRA_ORDERS = AGENT_ORDERS_AFTER - AGENT_ORDERS_BEFORE; // 460
export const REVENUE_RECOVERED_MONTH = EXTRA_ORDERS * AOV; // 97,520
export const REVENUE_RECOVERED_YEAR = REVENUE_RECOVERED_MONTH * 12; // 1,170,240
export const GAVE_UP_BEFORE = 41; // % of agent sessions ending in "couldn't confirm price or stock"
export const GAVE_UP_AFTER = 2;
export const CART_REACH_BEFORE = 3.1; // % of agent sessions that reached a cart
export const CART_REACH_AFTER = 14.6;

export const SHOPPER_ASK =
  "Find me a lightweight two-person tent under $600 that can get to Hobart by Friday. I'm doing the Overland Track next week.";

export const PRODUCT = {
  title: "Kosciuszko 2P Ultralight Tent",
  handle: "kosciuszko-2p-tent",
  price: 549,
  compareAt: 649,
  currency: "AUD",
  weight: "1.6 kg",
  sleeps: 2,
  colours: ["Eucalypt", "Sand"],
  stock: { Eucalypt: 23, Sand: 0 } as Record<string, number>,
  delivery: "Hobart (TAS 7000): order by 2pm Wed, arrives Fri",
  rating: 4.8,
  reviews: 312,
  sku: "SR-K2P-EUC",
  summary:
    "Freestanding two-person hiking tent. Two doors, two vestibules, rated for alpine conditions. Pitches in under four minutes.",
};

export const FOOTPRINT = {
  title: "Kosciuszko 2P Footprint",
  handle: "kosciuszko-2p-footprint",
  price: 49,
  currency: "AUD",
  sku: "SR-K2P-FP",
};

// What a screen-scraping agent pulls out of the page today (simulated)
export const SCRAPE_STEPS = [
  { label: "Download the page", detail: "412 KB of HTML, 38 scripts, 2 carousels, 1 cookie banner", tone: "neutral" as const },
  { label: "Guess the price", detail: "Finds \"$649\" first. It's the struck-through RRP, not the $549 sale price.", tone: "bad" as const },
  { label: "Guess the stock", detail: "Stock loads after the page renders. Agent sees \"Check availability\" and nothing else.", tone: "bad" as const },
  { label: "Guess the options", detail: "Colour picker is a set of image swatches. Reads \"Sand: Sold out\" and stops.", tone: "bad" as const },
  { label: "Give up", detail: "Can't confirm price, stock or delivery. Recommends a marketplace listing instead.", tone: "bad" as const },
];

export type ToolCall = {
  name: string;
  label: string;
  args: Record<string, unknown>;
  result: unknown;
  ms: number;
};

export type ChatItem =
  | { kind: "user"; text: string }
  | { kind: "agent"; text: string }
  | { kind: "tool"; call: ToolCall };

export const CONVERSATION: ChatItem[] = [
  { kind: "user", text: SHOPPER_ASK },
  {
    kind: "tool",
    call: {
      name: "search_catalog",
      label: "Search the catalog",
      args: { query: "lightweight 2 person hiking tent", max_price: 600, currency: "AUD" },
      result: [
        { title: "Kosciuszko 2P Ultralight Tent", price: "549.00 AUD", weight: "1.6 kg" },
        { title: "Bogong 2P Trekker", price: "429.00 AUD", weight: "2.4 kg" },
        { title: "Coastline 2P Dome", price: "319.00 AUD", weight: "2.9 kg" },
      ],
      ms: 180,
    },
  },
  {
    kind: "tool",
    call: {
      name: "get_product",
      label: "Read product details",
      args: { handle: "kosciuszko-2p-tent" },
      result: { price: "549.00 AUD", was: "649.00 AUD", options: { colour: ["Eucalypt", "Sand"] }, rating: "4.8 (312)" },
      ms: 95,
    },
  },
  {
    kind: "tool",
    call: {
      name: "check_availability",
      label: "Check availability",
      args: { handle: "kosciuszko-2p-tent", colour: "Eucalypt", deliver_to: "TAS 7000" },
      result: { in_stock: true, quantity: 23, delivery: "Order by 2pm Wed, arrives Fri" },
      ms: 120,
    },
  },
  {
    kind: "agent",
    text: "Best match is the Kosciuszko 2P from Saltbush & Ridge: 1.6 kg, $549 (down from $649), Eucalypt is in stock and arrives in Hobart Friday if you order by 2pm Wednesday. Their matching footprint is $49, which keeps you under $600. Want both in a cart?",
  },
  { kind: "user", text: "Yes, both please." },
  {
    kind: "tool",
    call: {
      name: "create_cart",
      label: "Build the cart",
      args: { lines: [{ sku: "SR-K2P-EUC", qty: 1 }, { sku: "SR-K2P-FP", qty: 1 }] },
      result: { cart: "c1-7f3a9", subtotal: "598.00 AUD", shipping: "Free" },
      ms: 140,
    },
  },
  {
    kind: "tool",
    call: {
      name: "get_checkout_link",
      label: "Get a checkout link",
      args: { cart: "c1-7f3a9" },
      result: { checkout_url: "https://saltbushandridge.com.au/checkouts/c1-7f3a9" },
      ms: 60,
    },
  },
  {
    kind: "agent",
    text: "Done. Your cart is ready: tent + footprint, $598, free shipping, arriving Friday. Tap below to review and pay on Saltbush & Ridge's checkout.",
  },
];

export const fmtAud = (n: number, dp = 0) =>
  `$${n.toLocaleString("en-AU", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
export const fmtInt = (n: number) => n.toLocaleString("en-AU");
