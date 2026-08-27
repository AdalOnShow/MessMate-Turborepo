"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-full",
        months: "relative",
        month: "w-full",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "absolute top-0 w-full flex items-center justify-between",
        button_previous:
          "z-10 inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground",
        button_next:
          "z-10 inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground",
        chevron: "h-4 w-4",
        month_grid: "w-full border-collapse space-y-1 mt-3",
        weekdays: "flex",
        weekday:
          "text-foreground-muted rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "p-0 text-center text-sm",
        day_button:
          "h-9 w-9 rounded-lg p-0 font-normal transition-colors hover:bg-surface-raised hover:text-foreground aria-selected:opacity-100",
        range_start:
          "bg-primary text-white rounded-lg hover:bg-primary hover:text-white",
        range_middle:
          "bg-primary/15 text-primary rounded-none hover:bg-primary/20 hover:text-primary",
        range_end:
          "bg-primary text-white rounded-lg hover:bg-primary hover:text-white",
        selected:
          "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
        today: "bg-primary/10 text-primary font-semibold",
        outside: "text-foreground-muted/40 opacity-50",
        disabled: "text-foreground-muted/40 opacity-50 pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({
          orientation,
        }: {
          className?: string;
          orientation?: "up" | "down" | "left" | "right";
        }) =>
          orientation === "right" ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
