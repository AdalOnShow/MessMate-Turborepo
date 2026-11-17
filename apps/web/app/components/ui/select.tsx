"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/app/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "select",
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-border-strong bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
          >
            <span
              className={cn(
                "truncate",
                !selectedLabel && "text-foreground-muted",
              )}
            >
              {selectedLabel || placeholder}
            </span>
            <svg
              className={`h-4 w-4 shrink-0 text-foreground-muted transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </PopoverTrigger>
      </div>

      {/* Portalled so a parent's overflow-hidden can't clip it; Radix flips it
          above the trigger when there's no room below, and the list scrolls
          once it's taller than the space available (capped at 16rem). */}
      <PopoverContent
        align="start"
        collisionPadding={8}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const list = e.currentTarget as HTMLElement | null;
          list
            ?.querySelector<HTMLElement>("[data-selected=true]")
            ?.scrollIntoView({ block: "nearest" });
        }}
        className="max-h-[min(16rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] overflow-y-auto overscroll-contain rounded-lg p-0 shadow-lg"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            data-selected={value === option.value}
            onClick={() => {
              onValueChange(option.value);
              setOpen(false);
            }}
            className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
              value === option.value
                ? "bg-primary/15 text-primary"
                : "text-foreground hover:bg-surface-raised"
            }`}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
