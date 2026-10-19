"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AGENT_CONVERSION_AFTER,
  AGENT_CONVERSION_BEFORE,
  AGENT_ORDERS_AFTER,
  AGENT_ORDERS_BEFORE,
  AGENT_SESSIONS,
  AGENT_SHARE,
  AOV,
  CART_REACH_AFTER,
  CART_REACH_BEFORE,
  COMPANY,
  COMPANY_BLURB,
  CONVERSATION,
  DOMAIN,
  EXTRA_ORDERS,
  FOOTPRINT,
  GAVE_UP_AFTER,
  GAVE_UP_BEFORE,
  HUMAN_CONVERSION,
  MONTHLY_SESSIONS,
  PRODUCT,
  PRODUCT_PATH,
  PRODUCT_URL,
  REVENUE_RECOVERED_MONTH,
  REVENUE_RECOVERED_YEAR,
  SCRAPE_STEPS,
  SHOPPER_ASK,
  fmtAud,
  fmtInt,
  type ChatItem,
} from "./data";
import { JsonBlock, Panel, VercelMark } from "./ui";

type Step = "shopper" | "scrape" | "twoviews" | "mcp" | "checkout" | "outcome";

const STEPS: { id: Step; label: string }[] = [
  { id: "shopper", label: "The new shopper" },
  { id: "scrape", label: "Today: the agent guesses" },
  { id: "twoviews", label: "One URL, two shoppers" },
  { id: "mcp", label: "The agent shops" },
  { id: "checkout", label: "Tap to confirm" },
  { id: "outcome", label: "What it's worth" },
];

/* ---------------- shared bits ---------------- */

function PrimaryButton({
  onClick,
  children,
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:text-foreground"
    >
      {children}
    </button>
  );
}

function StageHeader({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">{eyebrow}</div>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "bad" | "good";
}) {
  const cls = tone === "bad" ? "text-danger" : tone === "good" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold tracking-tight ${cls}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-[11.5px] text-subtle">{sub}</div> : null}
    </div>
  );
}

function UrlBar({ url, tag }: { url: string; tag?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-black px-3 py-1.5">
      <span className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
      </span>
      <span className="truncate font-mono text-[11.5px] text-muted">{url}</span>
      {tag ? <span className="ml-auto shrink-0">{tag}</span> : null}
    </div>
  );
}

function TentArt({ colour = "Eucalypt", className = "h-40 w-full" }: { colour?: string; className?: string }) {
  const fill = colour === "Sand" ? "#c8b48a" : "#5f7f62";
  const dark = colour === "Sand" ? "#a08c62" : "#435c46";
  return (
    <svg className={className} viewBox="0 0 320 180" aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1b1f22" />
          <stop offset="1" stopColor="#0e1012" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#sky)" />
      <path d="M0 140 L70 92 L120 120 L190 70 L250 112 L320 84 L320 180 L0 180 Z" fill="#171a1c" />
      <path d="M0 160 L320 150 L320 180 L0 180 Z" fill="#202426" />
      <path d="M92 152 L160 66 L228 152 Z" fill={fill} />
      <path d="M160 66 L228 152 L196 152 Z" fill={dark} />
      <path d="M146 152 L160 112 L174 152 Z" fill="#0d0f10" />
      <path d="M160 66 L160 58" stroke="#d9d9d9" strokeWidth="2" />
    </svg>
  );
}

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${small ? "text-[12px]" : "text-[13px]"} font-semibold tracking-tight`}>
      <svg viewBox="0 0 20 20" className={small ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden>
        <path d="M2 16 L8 6 L11 11 L13 8 L18 16 Z" fill="#7d9b7f" />
      </svg>
      {COMPANY}
    </span>
  );
}

/* ---------------- Stage 1: the new shopper ---------------- */

function ShopperStage({ go }: { go: (s: Step) => void }) {
  const max = Math.max(...AGENT_SHARE.map((m) => m.pct));
  return (
    <div className="space-y-6 fade-in">
      <StageHeader
        eyebrow={`${COMPANY} · fictional Australian outdoor retailer`}
        title="A new kind of shopper is arriving"
        body={
          <>
            {COMPANY_BLURB} More and more of its shoppers don&apos;t start on the website. They ask an AI assistant
            to find the product for them, and the assistant comes to the store on their behalf.
          </>
        }
        action={<PrimaryButton onClick={() => go("scrape")}>Watch an agent try to shop →</PrimaryButton>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Store sessions that arrive from an AI assistant" badge="Simulated">
          <div className="flex h-56 items-end gap-4 px-2 pt-4">
            {AGENT_SHARE.map((m, i) => (
              <div key={m.m} className="flex flex-1 flex-col items-center gap-2">
                <span className={`font-mono text-[12px] tabular-nums ${i === AGENT_SHARE.length - 1 ? "text-foreground" : "text-muted"}`}>
                  {m.pct}%
                </span>
                <div
                  className={`row-in w-full rounded-t-md ${i === AGENT_SHARE.length - 1 ? "bg-white" : "bg-white/25"}`}
                  style={{ height: `${(m.pct / max) * 160}px`, animationDelay: `${i * 70}ms` }}
                />
                <span className="font-mono text-[11px] text-subtle">{m.m}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-muted">
            Up five-fold in six months. In September, {fmtInt(AGENT_SESSIONS)} of {fmtInt(MONTHLY_SESSIONS)} sessions were an
            assistant shopping for someone.
          </p>
        </Panel>

        <div className="grid gap-3">
          <Stat label="Sessions from AI assistants (Sep)" value={fmtInt(AGENT_SESSIONS)} sub="11.2% of all store sessions" />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="People: conversion" value={`${HUMAN_CONVERSION}%`} sub="browse and buy" />
            <Stat label="Agents: conversion" value={`${AGENT_CONVERSION_BEFORE}%`} sub="most never get to a cart" tone="bad" />
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="text-[12px] text-muted">What the analytics show</div>
            <div className="mt-1 text-[14px]">A spike of short, bounced &ldquo;direct&rdquo; visits.</div>
            <div className="mt-0.5 text-[11.5px] text-subtle">The lost sales don&apos;t show up anywhere. Nobody knows they happened.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Stage 2: today, the agent guesses ---------------- */

function ScrapeStage({ go }: { go: (s: Step) => void }) {
  const [shown, setShown] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = shown >= SCRAPE_STEPS.length;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const run = () => {
    setShown(0);
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(i);
      if (i < SCRAPE_STEPS.length) timer.current = setTimeout(tick, 650);
    };
    timer.current = setTimeout(tick, 250);
  };

  return (
    <div className="space-y-6 fade-in">
      <StageHeader
        eyebrow="Today"
        title="The agent has to read a page built for people"
        body="A shopper asks their assistant for a tent. The assistant lands on the product page and has to pick the price, stock and options out of a layout designed for human eyes."
        action={
          done ? (
            <PrimaryButton onClick={() => go("twoviews")}>Now the same URL on Vercel Shop →</PrimaryButton>
          ) : (
            <PrimaryButton onClick={run} disabled={shown > 0}>
              Send the assistant shopping
            </PrimaryButton>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Panel title="The shopper's request" badge="AI assistant">
          <div className="space-y-3">
            <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-white px-4 py-2.5 text-[14px] text-black">{SHOPPER_ASK}</div>
            {shown > 0 && (
              <div className="row-in flex items-center gap-2 text-[12.5px] text-muted">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-warn" />
                Visiting {DOMAIN}
                {PRODUCT_PATH}
              </div>
            )}
            {done && (
              <div className="row-in max-w-[92%] rounded-2xl rounded-bl-sm border border-border bg-card-2 px-4 py-2.5 text-[14px]">
                I couldn&apos;t confirm the price or whether it&apos;s in stock at {COMPANY}. Here&apos;s a similar tent on a
                marketplace instead.
              </div>
            )}
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <UrlBar url={PRODUCT_URL} />
            <div className="relative">
              <div className="pointer-events-none select-none opacity-60 blur-[0.4px]">
                <div className="flex items-center justify-between border-b border-border bg-[#0d0d0d] px-3 py-2">
                  <BrandMark small />
                  <span className="text-[10px] text-subtle">Tents · Packs · Sleep · Sale</span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3">
                  <TentArt className="h-28 w-full rounded" />
                  <div className="space-y-1.5 text-[11px]">
                    <div className="font-medium">{PRODUCT.title}</div>
                    <div>
                      <span className="text-muted line-through">{fmtAud(PRODUCT.compareAt)}</span>{" "}
                      <span className="text-success">{fmtAud(PRODUCT.price)}</span>
                    </div>
                    <div className="h-2 w-20 shimmer rounded" />
                    <div className="h-2 w-24 shimmer rounded" />
                    <div className="text-subtle">Check availability ▸</div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 rounded border border-border bg-black/80 px-2 py-0.5 font-mono text-[10px] text-subtle">
                cookie banner · chat widget · 38 scripts
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="What the assistant can work out" badge="Screen-scrape">
          <ol className="space-y-2">
            {SCRAPE_STEPS.map((s, i) => {
              const on = i < shown;
              return (
                <li
                  key={s.label}
                  className={`flex gap-3 rounded-lg border px-3 py-2.5 transition ${
                    on ? (s.tone === "bad" ? "row-in border-danger/30 bg-danger/[0.05]" : "row-in border-border bg-card-2") : "border-border/50 opacity-30"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                      on && s.tone === "bad" ? "border-danger/50 text-danger" : "border-border text-subtle"
                    }`}
                  >
                    {on && s.tone === "bad" ? "✕" : i + 1}
                  </span>
                  <div>
                    <div className="text-[13.5px] font-medium">{s.label}</div>
                    <div className="text-[12.5px] text-muted">{s.detail}</div>
                  </div>
                </li>
              );
            })}
          </ol>
          {done && (
            <div className="row-in mt-4 grid grid-cols-2 gap-3">
              <Stat label="Sale for Saltbush & Ridge" value="Lost" tone="bad" sub="went to a marketplace" />
              <Stat label="Visible in their reports" value="No" tone="bad" sub="logged as a bounced visit" />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Stage 3: one URL, two shoppers ---------------- */

const AGENT_MARKDOWN = `# ${PRODUCT.title}

URL: ${PRODUCT_URL}
Price: ${PRODUCT.price}.00 ${PRODUCT.currency} (was ${PRODUCT.compareAt}.00 ${PRODUCT.currency})
Availability: In stock

## Options
- Colour: Eucalypt (in stock, ${PRODUCT.stock.Eucalypt} available)
- Colour: Sand (sold out)

## Details
- Weight: ${PRODUCT.weight}
- Sleeps: ${PRODUCT.sleeps}
- Delivery: ${PRODUCT.delivery}
- Rating: ${PRODUCT.rating} / 5 (${PRODUCT.reviews} reviews)

${PRODUCT.summary}`;

function HumanPage() {
  const [colour, setColour] = useState("Eucalypt");
  const inStock = PRODUCT.stock[colour] > 0;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0b0b0b]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <BrandMark />
        <span className="text-[11px] text-subtle">Tents · Packs · Sleep · Sale</span>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <TentArt colour={colour} className="h-44 w-full rounded-md" />
        <div className="space-y-2.5">
          <div className="text-[11px] text-subtle">Tents / Hiking</div>
          <div className="text-[17px] font-semibold leading-tight">{PRODUCT.title}</div>
          <div className="text-[12px] text-muted">
            ★ {PRODUCT.rating} · {PRODUCT.reviews} reviews
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[20px] font-semibold">{fmtAud(PRODUCT.price)}</span>
            <span className="text-[13px] text-subtle line-through">{fmtAud(PRODUCT.compareAt)}</span>
            <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10.5px] text-success">Sale</span>
          </div>
          <div className="flex gap-2">
            {PRODUCT.colours.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColour(c)}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] ${c === colour ? "border-white text-foreground" : "border-border text-muted"}`}
              >
                {c}
                {PRODUCT.stock[c] === 0 ? " · sold out" : ""}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`w-full rounded-md py-2 text-[13px] font-medium ${inStock ? "bg-white text-black" : "bg-white/10 text-subtle"}`}
          >
            {inStock ? "Add to cart" : "Sold out"}
          </button>
          <div className="text-[11.5px] text-muted">🚚 {PRODUCT.delivery}</div>
        </div>
      </div>
    </div>
  );
}

function TwoViewsStage({ go }: { go: (s: Step) => void }) {
  const [agentAsked, setAgentAsked] = useState(false);
  return (
    <div className="space-y-6 fade-in">
      <StageHeader
        eyebrow="With Vercel Shop"
        title="One product URL. Two kinds of shoppers."
        body="Same store, same URL. A person gets the visual product page. An agent gets the product information it needs (price, availability, options) as clean, readable content, with no layout to decode."
        action={
          agentAsked ? (
            <PrimaryButton onClick={() => go("mcp")}>Let the agent shop →</PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => setAgentAsked(true)}>Send the agent to the same URL</PrimaryButton>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="What a person sees" badge="Product page" bodyClassName="p-4 space-y-3">
          <UrlBar url={PRODUCT_URL} tag={<span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">Person</span>} />
          <HumanPage />
          <div className="flex justify-between text-[11.5px] text-subtle">
            <span>Fast, branded, built on Next.js</span>
            <span className="font-mono">412 KB</span>
          </div>
        </Panel>

        <Panel title="What an agent reads" badge="Product info" bodyClassName="p-4 space-y-3">
          <UrlBar
            url={PRODUCT_URL}
            tag={<span className="rounded-full border border-blue/40 px-2 py-0.5 text-[10px] text-blue">Agent</span>}
          />
          {agentAsked ? (
            <>
              <pre className="row-in max-h-[380px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-black p-4 font-mono text-[11.5px] leading-[1.55] text-foreground/90">
                {AGENT_MARKDOWN}
              </pre>
              <div className="flex justify-between text-[11.5px] text-subtle">
                <span>Exact price, live stock, every option</span>
                <span className="font-mono">1.3 KB</span>
              </div>
            </>
          ) : (
            <div className="flex h-[318px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center text-[13px] text-subtle">
              <span>Same URL, asked by an agent.</span>
              <span className="text-[12px]">Click &ldquo;Send the agent to the same URL&rdquo;.</span>
            </div>
          )}
        </Panel>
      </div>

      {agentAsked && (
        <div className="row-in grid gap-3 sm:grid-cols-3">
          {[
            ["Right price", `${fmtAud(PRODUCT.price)}, the sale price, not the struck-through RRP`],
            ["Right stock", "Eucalypt in stock, Sand sold out, read straight from Shopify"],
            ["Found by answer engines", "Structured data in every page and the sitemap"],
          ].map(([h, b]) => (
            <div key={h} className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <span className="text-success">✓</span>
                {h}
              </div>
              <div className="mt-0.5 text-[12px] text-muted">{b}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Stage 4: the agent shops over MCP ---------------- */

const TOOLS = [
  { name: "search_catalog", label: "Search the catalog" },
  { name: "get_product", label: "Read product details" },
  { name: "check_availability", label: "Check availability" },
  { name: "create_cart", label: "Build the cart" },
  { name: "get_checkout_link", label: "Get a checkout link" },
];

function ChatBubble({ item }: { item: ChatItem }) {
  if (item.kind === "user")
    return <div className="row-in ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-white px-4 py-2.5 text-[13.5px] text-black">{item.text}</div>;
  if (item.kind === "agent")
    return (
      <div className="row-in max-w-[92%] rounded-2xl rounded-bl-sm border border-border bg-card-2 px-4 py-2.5 text-[13.5px] leading-relaxed">
        {item.text}
      </div>
    );
  return (
    <div className="row-in flex items-center gap-2 rounded-lg border border-blue/25 bg-blue/[0.05] px-3 py-1.5 text-[12px]">
      <span className="font-mono text-[10px] uppercase tracking-wide text-blue">MCP</span>
      <span>{item.call.label}</span>
      <span className="ml-auto font-mono text-[11px] text-subtle">{item.call.ms} ms</span>
    </div>
  );
}

function McpStage({ go }: { go: (s: Step) => void }) {
  const [shown, setShown] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const done = shown >= CONVERSATION.length;
  const playing = shown > 1 && !done;

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [shown]);

  const play = () => {
    let i = 1;
    const tick = () => {
      i += 1;
      setShown(i);
      if (i < CONVERSATION.length) {
        const next = CONVERSATION[i];
        timer.current = setTimeout(tick, next.kind === "tool" ? 700 : 1200);
      }
    };
    timer.current = setTimeout(tick, 300);
  };

  const skip = () => {
    if (timer.current) clearTimeout(timer.current);
    setShown(CONVERSATION.length);
  };

  const visible = CONVERSATION.slice(0, shown);
  const lastTool = [...visible].reverse().find((c) => c.kind === "tool");
  const usedTools = new Set(visible.filter((c) => c.kind === "tool").map((c) => (c.kind === "tool" ? c.call.name : "")));
  const activeTool = lastTool && lastTool.kind === "tool" ? lastTool.call : null;

  return (
    <div className="space-y-6 fade-in">
      <StageHeader
        eyebrow="With Vercel Shop"
        title="The agent searches, checks stock and builds the cart"
        body={
          <>
            The store offers shopping tools over MCP at its own domain, {DOMAIN}. The assistant searches the catalog, reads
            the product, checks availability and builds a real Shopify cart, without ever navigating the site.
          </>
        }
        action={
          done ? (
            <PrimaryButton onClick={() => go("checkout")}>Hand it back to the shopper →</PrimaryButton>
          ) : (
            <>
              {playing && <GhostButton onClick={skip}>Skip to end</GhostButton>}
              <PrimaryButton onClick={play} disabled={playing}>
                {playing ? "Shopping…" : "Play the conversation"}
              </PrimaryButton>
            </>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Panel title="Shopper ↔ AI assistant" badge="Conversation" bodyClassName="p-0">
          <div ref={chatRef} className="h-[430px] space-y-3 overflow-y-auto p-4">
            {visible.map((c, i) => (
              <ChatBubble key={i} item={c} />
            ))}
            {playing && (
              <div className="flex items-center gap-1.5 pl-1 text-subtle">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-white/50" />
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-white/50 [animation-delay:150ms]" />
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-white/50 [animation-delay:300ms]" />
              </div>
            )}
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title={`Shopping tools at ${DOMAIN}`} badge="MCP">
            <ul className="space-y-1.5">
              {TOOLS.map((t) => {
                const used = usedTools.has(t.name);
                const active = activeTool?.name === t.name;
                return (
                  <li
                    key={t.name}
                    className={`flex items-center justify-between rounded-md border px-3 py-1.5 text-[12.5px] transition ${
                      active ? "border-blue/50 bg-blue/[0.07]" : used ? "border-border bg-card-2" : "border-border/60 text-muted"
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`text-[11px] ${used ? "text-success" : "text-subtle"}`}>{used ? "✓ used" : "ready"}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <Panel title={activeTool ? `Latest: ${activeTool.label}` : "Latest tool result"} badge="From Shopify" bodyClassName="p-3">
            {activeTool ? (
              <div key={activeTool.name} className="fade-in">
                <JsonBlock data={activeTool.result} />
              </div>
            ) : (
              <div className="py-8 text-center text-[12.5px] text-subtle">Press &ldquo;Play the conversation&rdquo;.</div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Stage 5: tap to confirm ---------------- */

function CheckoutStage({ go }: { go: (s: Step) => void }) {
  const [phase, setPhase] = useState<"cart" | "checkout" | "paid">("cart");
  const subtotal = PRODUCT.price + FOOTPRINT.price;
  return (
    <div className="space-y-6 fade-in">
      <StageHeader
        eyebrow="With Vercel Shop"
        title="The shopper taps once to confirm"
        body={`The assistant did the legwork. The shopper reviews the cart and pays on ${COMPANY}'s own Shopify checkout, and the order lands in Shopify like any other order.`}
        action={
          phase === "paid" ? <PrimaryButton onClick={() => go("outcome")}>What this is worth →</PrimaryButton> : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Panel title="In the shopper's assistant" badge="Cart ready">
          <div className="mx-auto max-w-sm space-y-3 rounded-2xl border border-border bg-black p-4">
            <div className="flex items-center justify-between">
              <BrandMark small />
              <span className="text-[11px] text-subtle">Cart · 2 items</span>
            </div>
            {[
              { t: PRODUCT.title, s: "Eucalypt", p: PRODUCT.price },
              { t: FOOTPRINT.title, s: "Matches Kosciuszko 2P", p: FOOTPRINT.price },
            ].map((l) => (
              <div key={l.t} className="flex items-center justify-between border-b border-border pb-2 text-[13px]">
                <div>
                  <div>{l.t}</div>
                  <div className="text-[11px] text-subtle">{l.s}</div>
                </div>
                <span className="font-mono">{fmtAud(l.p)}</span>
              </div>
            ))}
            <div className="flex justify-between text-[12px] text-muted">
              <span>Shipping to Hobart · arrives Fri</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-[15px] font-semibold">
              <span>Total</span>
              <span className="font-mono">{fmtAud(subtotal)}</span>
            </div>
            <button
              type="button"
              onClick={() => setPhase("checkout")}
              disabled={phase !== "cart"}
              className="w-full rounded-full bg-white py-2.5 text-[13.5px] font-medium text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              {phase === "cart" ? "Review and pay" : "Opened checkout ✓"}
            </button>
          </div>
        </Panel>

        <Panel title={phase === "paid" ? "Order confirmed" : "Checkout"} badge="Shopify checkout">
          {phase === "cart" && (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border text-center text-[13px] text-subtle">
              Tap &ldquo;Review and pay&rdquo; in the assistant.
            </div>
          )}
          {phase === "checkout" && (
            <div className="row-in space-y-3">
              <UrlBar url={`https://${DOMAIN}/checkouts/c1-7f3a9`} />
              <div className="space-y-3 rounded-lg border border-border bg-[#0b0b0b] p-4">
                <BrandMark />
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div className="rounded-md border border-border px-3 py-2">
                    <div className="text-subtle">Contact</div>
                    <div>sam.k•••@gmail.com</div>
                  </div>
                  <div className="rounded-md border border-border px-3 py-2">
                    <div className="text-subtle">Ship to</div>
                    <div>Hobart TAS 7000</div>
                  </div>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted">2 items · free shipping</span>
                  <span className="font-mono font-semibold">{fmtAud(subtotal, 2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPhase("paid")}
                  className="w-full rounded-md bg-[#5a31f4] py-2.5 text-[13.5px] font-semibold text-white transition hover:brightness-110"
                >
                  Pay now
                </button>
              </div>
            </div>
          )}
          {phase === "paid" && (
            <div className="row-in space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/[0.06] px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-black">✓</span>
                <div>
                  <div className="text-[14px] font-medium">Order #SR-20418 confirmed · {fmtAud(subtotal, 2)}</div>
                  <div className="text-[12px] text-muted">Arrives in Hobart Friday. Receipt sent.</div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card-2 p-4">
                <div className="mb-2 flex justify-between text-[12px] text-muted"><span>{COMPANY}&apos;s latest orders</span><span className="text-subtle">arrived via</span></div>
                <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-4 gap-y-2 text-[12.5px]">
                  {[
                    ["#SR-20418", "Kosciuszko 2P + footprint", "AI assistant", fmtAud(subtotal)],
                    ["#SR-20417", "Alpine 650 down sleeping bag", "Web", "$389"],
                    ["#SR-20416", "Ridge 45L pack", "AI assistant", "$279"],
                  ].map(([id, what, ch, amt], i) => (
                    <div key={id} className={`contents ${i === 0 ? "" : "text-muted"}`}>
                      <span className="font-mono">{id}</span>
                      <span className="truncate">{what}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10.5px] ${
                          ch === "AI assistant" ? "border-blue/40 text-blue" : "border-border text-subtle"
                        }`}
                      >
                        {ch}
                      </span>
                      <span className="text-right font-mono">{amt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Stage 6: what it's worth ---------------- */

function CompareBar({ label, before, after, unit, max }: { label: string; before: number; after: number; unit: string; max: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[12.5px]">
        <span className="text-muted">{label}</span>
        <span className="font-mono">
          <span className="text-subtle">{before}{unit}</span> → <span className="text-success">{after}{unit}</span>
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${(before / max) * 100}%` }} />
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
        <div className="row-in absolute inset-y-0 left-0 rounded-full bg-success" style={{ width: `${(after / max) * 100}%` }} />
      </div>
    </div>
  );
}

function OutcomeStage() {
  return (
    <div className="space-y-6 fade-in">
      <StageHeader
        eyebrow="The outcome"
        title="Agents stop leaving. They start buying."
        body={`${COMPANY} serves people and agents from one store. The shoppers who arrive through an AI assistant now get the right price, the right stock and a ready cart, and those orders show up in the numbers.`}
      />

      <div className="flex items-center gap-2 text-[11.5px] text-warn">
        <span className="rounded-full border border-warn/40 px-2 py-0.5 font-mono uppercase tracking-wide">Simulated</span>
        Illustrative example figures for a fictional company, one month of agent traffic.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Agent-sourced orders / month" value={`${AGENT_ORDERS_BEFORE} → ${AGENT_ORDERS_AFTER}`} sub={`+${EXTRA_ORDERS} orders`} tone="good" />
        <Stat label="Agent conversion" value={`${AGENT_CONVERSION_BEFORE}% → ${AGENT_CONVERSION_AFTER}%`} sub={`people convert at ${HUMAN_CONVERSION}%`} tone="good" />
        <Stat label="Revenue recovered / month" value={fmtAud(REVENUE_RECOVERED_MONTH)} sub={`${EXTRA_ORDERS} orders × ${fmtAud(AOV)} average`} tone="good" />
        <Stat label="Revenue recovered / year" value={`$${(REVENUE_RECOVERED_YEAR / 1_000_000).toFixed(2)}M`} sub="at today's agent traffic" tone="good" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Before and after, agent shoppers only" badge="Simulated">
          <div className="space-y-5">
            <CompareBar label="Conversion" before={AGENT_CONVERSION_BEFORE} after={AGENT_CONVERSION_AFTER} unit="%" max={4} />
            <CompareBar label="Agent sessions that got the right price and stock" before={100 - GAVE_UP_BEFORE} after={100 - GAVE_UP_AFTER} unit="%" max={100} />
            <CompareBar label="Agent sessions that reached a cart" before={CART_REACH_BEFORE} after={CART_REACH_AFTER} unit="%" max={20} />
            <div className="flex gap-4 text-[11px] text-subtle">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/30" /> Before (screen-scrape)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> With Vercel Shop</span>
            </div>
          </div>
        </Panel>

        <div className="grid gap-3">
          {[
            ["One store, two kinds of shoppers", "The same product URL serves the page to people and readable product info to agents."],
            ["Agents can buy, not just browse", "Search, stock and cart over MCP at the store's own domain."],
            ["Your checkout, your customer", "Shoppers confirm and pay on your Shopify checkout. The order and the relationship stay yours."],
            ["Built on Shopify, runs on Vercel", "Open-source Next.js storefront on Shopify's Hydrogen SDK, with an optional on-site shopping assistant."],
          ].map(([h, b]) => (
            <div key={h} className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="text-[13px] font-medium">{h}</div>
              <div className="mt-0.5 text-[12px] text-muted">{b}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */

export function Walkthrough() {
  const [step, setStep] = useState<Step>("shopper");
  const idx = STEPS.findIndex((s) => s.id === step);

  const go = useCallback((s: Step) => {
    setStep(s);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${s}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.replace("#", "") as Step;
      if (STEPS.some((s) => s.id === h)) setStep(h);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const i = STEPS.findIndex((s) => s.id === step);
      if (e.key === "ArrowRight" && i < STEPS.length - 1) go(STEPS[i + 1].id);
      if (e.key === "ArrowLeft" && i > 0) go(STEPS[i - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, go]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] grid-bg [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <header className="relative z-10 border-b border-border bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <VercelMark className="h-4 w-4" />
            <span className="text-subtle">/</span>
            <span className="text-sm font-medium">Vercel Shop · Agent-ready storefront</span>
            <span className="hidden rounded-full border border-border px-2 py-0.5 text-[11px] text-muted sm:inline">{COMPANY}</span>
            <span className="hidden rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-subtle md:inline">
              Simulated demo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[11px] text-subtle md:inline">
              {idx + 1} / {STEPS.length}
            </span>
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => go(STEPS[Math.max(0, idx - 1)].id)}
              className="rounded-full border border-border px-3 py-1 text-[12px] text-muted hover:text-foreground disabled:opacity-30"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={idx === STEPS.length - 1}
              onClick={() => go(STEPS[Math.min(STEPS.length - 1, idx + 1)].id)}
              className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-black hover:bg-white/90 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] transition ${
                s.id === step ? "bg-white/[0.1] text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border font-mono text-[9.5px] ${
                  i < idx ? "border-success/50 text-success" : s.id === step ? "border-white text-foreground" : "border-border text-subtle"
                }`}
              >
                {i < idx ? "✓" : i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        {step === "shopper" && <ShopperStage go={go} />}
        {step === "scrape" && <ScrapeStage go={go} />}
        {step === "twoviews" && <TwoViewsStage go={go} />}
        {step === "mcp" && <McpStage go={go} />}
        {step === "checkout" && <CheckoutStage go={go} />}
        {step === "outcome" && <OutcomeStage />}
      </div>

      <footer className="relative z-10 border-t border-border py-4 text-center text-[11px] text-subtle">
        Simulated demo · {COMPANY} is a fictional company and all figures are illustrative · walkthrough of Vercel Shop, the
        Next.js storefront template for Shopify
      </footer>
    </div>
  );
}
