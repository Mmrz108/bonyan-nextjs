import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-md border bg-[var(--surface-elevated)] px-3 text-sm text-[var(--ink)]",
          "placeholder:text-[var(--muted)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-1",
          invalid
            ? "border-[var(--danger)]"
            : "border-[var(--line)] hover:border-[var(--line-strong)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
