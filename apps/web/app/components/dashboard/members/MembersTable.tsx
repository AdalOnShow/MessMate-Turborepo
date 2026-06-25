"use client";

import type { MemberData, MemberFilters } from "../../../hooks/use-members";

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "User";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MembersTable({
  members,
  isManager,
  currentUserId,
  onRoleClick,
  onRemoveClick,
}: {
  members: MemberData[];
  isManager: boolean;
  currentUserId?: string;
  onRoleClick: (member: MemberData) => void;
  onRemoveClick: (member: MemberData) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-foreground-muted/10">
            <th className="px-3 py-3 font-semibold text-foreground sm:px-4">
              Member
            </th>
            <th className="hidden px-3 py-3 font-semibold text-foreground sm:table-cell sm:px-4">
              Role
            </th>
            <th className="hidden px-3 py-3 font-semibold text-foreground md:table-cell md:px-4">
              Joined
            </th>
            <th className="hidden px-3 py-3 font-semibold text-foreground sm:table-cell sm:px-4">
              Status
            </th>
            {isManager && (
              <th className="px-3 py-3 font-semibold text-foreground sm:px-4">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              className="border-b border-foreground-muted/5 last:border-0"
            >
              <td className="px-3 py-3 sm:px-4">
                <div className="flex items-center gap-3">
                  {member.user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.user.avatar}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {initials(member.user.name, member.user.email)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {member.user.name}
                    </p>
                    <p className="truncate text-xs text-foreground-muted">
                      {member.user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-2 sm:hidden">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          member.mess_role === "MANAGER"
                            ? "bg-primary/15 text-primary"
                            : "bg-surface-raised text-foreground-muted"
                        }`}
                      >
                        {member.mess_role}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          member.removed_at
                            ? "bg-destructive/15 text-destructive"
                            : "bg-success/15 text-success"
                        }`}
                      >
                        {member.removed_at ? "Removed" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    member.mess_role === "MANAGER"
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-raised text-foreground-muted"
                  }`}
                >
                  {member.mess_role}
                </span>
              </td>
              <td className="hidden px-3 py-3 text-foreground-muted md:table-cell md:px-4">
                {new Date(member.joined_at).toLocaleDateString()}
              </td>
              <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    member.removed_at
                      ? "bg-destructive/15 text-destructive"
                      : "bg-success/15 text-success"
                  }`}
                >
                  {member.removed_at ? "Removed" : "Active"}
                </span>
              </td>
              {isManager && (
                <td className="px-3 py-3 sm:px-4">
                  {!member.removed_at &&
                    member.user_id !== currentUserId && (
                      <div className="flex gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => onRoleClick(member)}
                          className="rounded-lg border border-foreground-muted/20 px-2 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground sm:px-3"
                        >
                          Role
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveClick(member)}
                          className="rounded-lg border border-destructive/20 px-2 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 sm:px-3"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
