import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardTone = "default" | "accent" | "success" | "warning" | "danger";

const toneStyles: Record<
  StatCardTone,
  { icon: string; value: string; wash: string }
> = {
  default: {
    icon: "bg-[var(--brand-tint)] text-[var(--brand)]",
    value: "text-[var(--ink)]",
    wash: "from-[var(--brand-tint)]/40",
  },
  accent: {
    icon: "bg-[color-mix(in_srgb,var(--accent)_18%,white)] text-[var(--accent)]",
    value: "text-[var(--ink)]",
    wash: "from-[color-mix(in_srgb,var(--accent)_12%,white)]",
  },
  success: {
    icon: "bg-[var(--success-tint)] text-[var(--success)]",
    value: "text-[var(--success)]",
    wash: "from-[var(--success-tint)]",
  },
  warning: {
    icon: "bg-[color-mix(in_srgb,var(--accent)_22%,white)] text-[color-mix(in_srgb,var(--accent)_80%,#7a4e12)]",
    value: "text-[color-mix(in_srgb,var(--accent)_85%,#5c3a0a)]",
    wash: "from-[color-mix(in_srgb,var(--accent)_14%,white)]",
  },
  danger: {
    icon: "bg-[var(--danger-tint)] text-[var(--danger)]",
    value: "text-[var(--danger)]",
    wash: "from-[var(--danger-tint)]",
  },
};

export type StatCardProps = {
  label: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function StatCard({
  label,
  value,
  description,
  icon,
  tone = "default",
  className,
  ...props
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)] p-5",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-80",
          styles.wash,
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-tight",
              styles.value,
            )}
          >
            {value}
          </p>
          {description ? (
            <p className="mt-1.5 text-xs text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
              styles.icon,
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)] p-5",
        className,
      )}
    >
      <div className="h-3 w-24 rounded bg-[var(--surface-muted)]" />
      <div className="mt-4 h-8 w-16 rounded bg-[var(--surface-muted)]" />
      <div className="mt-3 h-3 w-32 rounded bg-[var(--surface-muted)]" />
    </div>
  );
}
