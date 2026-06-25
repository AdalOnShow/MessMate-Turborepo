"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Select } from "../../ui/select";
import { useDebounce } from "../../../hooks/use-debounce";
import type { MemberFilters } from "../../../hooks/use-members";

const roleOptions = [
  { value: "", label: "All Roles" },
  { value: "MANAGER", label: "Manager" },
  { value: "MEMBER", label: "Member" },
];

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "REMOVED", label: "Removed" },
];

export const MemberFiltersBar = React.memo(function MemberFiltersBar({
  onSearchChange,
  filters,
  onFilterChange,
}: {
  onSearchChange: (value: string) => void;
  filters: MemberFilters;
  onFilterChange: (updates: Partial<Pick<MemberFilters, "role" | "status">>) => void;
}) {
  const [localSearch, setLocalSearch] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(localSearch, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(filters.search ?? "");
  }, [filters.search]);

  const options = useMemo(() => ({ roleOptions, statusOptions }), []);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search by name or email..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        className="flex-1 rounded-lg border border-foreground-muted/20 bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
      />
      <div className="flex gap-3">
        <Select
          value={filters.role ?? ""}
          onValueChange={(v) =>
            onFilterChange({ role: (v as "MANAGER" | "MEMBER") || undefined })
          }
          options={roleOptions}
          className="flex-1 sm:flex-none"
        />
        <Select
          value={filters.status ?? ""}
          onValueChange={(v) =>
            onFilterChange({
              status: (v as "ACTIVE" | "REMOVED") || undefined,
            })
          }
          options={statusOptions}
          className="flex-1 sm:flex-none"
        />
      </div>
    </div>
  );
});
