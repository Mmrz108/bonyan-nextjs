"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  hidden?: boolean;
};

type TabsProps<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  const visible = items.filter((item) => !item.hidden);

  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap gap-1 border-b border-[var(--line)]",
        className,
      )}
    >
      {visible.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-[var(--brand-strong)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]",
            )}
          >
            {item.label}
            {active ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--brand)]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("pt-5", className)}>{children}</div>;
}
