"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand)] text-[var(--brand-contrast)] hover:bg-[var(--brand-strong)] shadow-[0_1px_0_rgba(11,61,58,0.2)]",
  secondary:
    "bg-[var(--surface-elevated)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--surface-muted)]",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--surface-muted)]",
  danger:
    "bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Spinner size="sm" className="text-current" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
