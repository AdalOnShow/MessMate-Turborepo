"use client";

import { useState } from "react";
import { useDebounce } from "../../../hooks/use-debounce";
import { useSearchUsers } from "../../../hooks/use-members";

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "User";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AddMemberDialog({
  existingMemberIds,
  onClose,
  onAdd,
  isPending,
}: {
  existingMemberIds: string[];
  onClose: () => void;
  onAdd: (userId: string) => void;
  isPending: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: searchResults = [], isLoading: searching } =
    useSearchUsers(debouncedQuery);

  const filteredResults = searchResults.filter(
    (u) => !existingMemberIds.includes(u.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-foreground-muted/15 bg-background p-6">
        <h2 className="mb-4 text-lg font-bold text-foreground">Add Member</h2>

        {!selectedUser ? (
          <>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="mb-4 w-full rounded-lg border border-foreground-muted/20 bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
            />

            {searching && debouncedQuery.length >= 2 && (
              <p className="text-sm text-foreground-muted">Searching...</p>
            )}

            {!searching && filteredResults.length > 0 && (
              <div className="mb-4 max-h-60 overflow-y-auto">
                {filteredResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-surface-raised"
                  >
                    {u.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {initials(u.name, u.email)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {u.name}
                      </p>
                      <p className="truncate text-xs text-foreground-muted">
                        {u.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!searching &&
              debouncedQuery.length >= 2 &&
              filteredResults.length === 0 && (
                <p className="mb-4 text-sm text-foreground-muted">
                  {searchResults.length > 0
                    ? "All matching users are already members"
                    : "No users found"}
                </p>
              )}
          </>
        ) : (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-surface p-3">
            {selectedUser.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedUser.avatar}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {initials(selectedUser.name, selectedUser.email)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {selectedUser.name}
              </p>
              <p className="truncate text-xs text-foreground-muted">
                {selectedUser.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="text-xs text-foreground-muted hover:text-foreground"
            >
              Change
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-foreground-muted/20 px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => selectedUser && onAdd(selectedUser.id)}
            disabled={!selectedUser || isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Adding..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}
