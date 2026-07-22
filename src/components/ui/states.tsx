import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";
import { Button } from "./button";

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-[var(--muted)]">
      <Spinner size="lg" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  className,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center",
        className,
      )}
    >
      <div className="rounded-md border border-[var(--danger-soft)] bg-[var(--danger-tint)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--danger)]">
        Error
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        {title}
      </h2>
      {description ? (
        <p className="max-w-md text-sm text-[var(--muted)]">{description}</p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          {retryLabel || "Try again"}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface-elevated)]/70 px-6 py-12 text-center",
        className,
      )}
    >
      <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
