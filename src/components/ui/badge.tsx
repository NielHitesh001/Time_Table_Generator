import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "sage" | "sand" | "ok" | "warn" | "navy";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-surface-2 text-ink-soft",
    sage: "bg-sage text-navy-deep",
    sand: "bg-sand text-navy-deep",
    ok: "bg-ok/12 text-ok",
    warn: "bg-warn/12 text-warn",
    navy: "bg-navy text-surface",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
