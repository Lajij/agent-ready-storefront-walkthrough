import type { ReactNode } from "react";

export function VercelMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 76 65" fill="currentColor" aria-hidden>
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}

export function Panel({
  title,
  badge,
  right,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title: ReactNode;
  badge?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="text-sm font-medium">{title}</span>
        <div className="flex items-center gap-2">
          {right}
          {badge ? (
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
              {badge}
            </span>
          ) : null}
        </div>
      </div>
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

export function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-black p-3 font-mono text-[11.5px] leading-[1.55] text-muted">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
