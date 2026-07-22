import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[var(--surface-muted)] text-[var(--ink-soft)]",
  brand: "bg-[var(--brand-tint)] text-[var(--brand)]",
  accent:
    "bg-[color-mix(in_srgb,var(--accent)_18%,white)] text-[color-mix(in_srgb,var(--accent)_85%,#5c3a0a)]",
  success: "bg-[var(--success-tint)] text-[var(--success)]",
  warning:
    "bg-[color-mix(in_srgb,var(--accent)_22%,white)] text-[color-mix(in_srgb,var(--accent)_80%,#7a4e12)]",
  danger: "bg-[var(--danger-tint)] text-[var(--danger)]",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
