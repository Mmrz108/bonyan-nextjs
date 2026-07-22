import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block animate-spin rounded-full border-[var(--line)] border-t-[var(--brand)]",
        sizes[size],
        className,
      )}
    />
  );
}
