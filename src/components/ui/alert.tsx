import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Info } from "lucide-react";

type AlertTone = "info" | "danger" | "success";

const tones: Record<AlertTone, string> = {
  info: "border-[var(--brand-soft)] bg-[var(--brand-tint)] text-[var(--brand-strong)]",
  danger: "border-[var(--danger-soft)] bg-[var(--danger-tint)] text-[var(--danger)]",
  success: "border-[var(--success-soft)] bg-[var(--success-tint)] text-[var(--success)]",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = tone === "danger" ? AlertCircle : Info;
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-md border px-3.5 py-3 text-sm",
        tones[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cn(title && "mt-1 opacity-90")}>{children}</div> : null}
      </div>
    </div>
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--surface-muted)]",
        className,
      )}
      {...props}
    />
  );
}
