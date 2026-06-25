"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../../store";
import { AuthInitializer } from "../../components/AuthInitializer";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { BottomNav } from "../../components/dashboard/BottomNav";
import { useGetMyMess } from "../../hooks/use-messes";
import {
  useMembers,
  useAddMember,
  useRemoveMember,
  useUpdateMemberRole,
  useSearchUsers,
  type MemberData,
  type MemberFilters,
} from "../../hooks/use-members";

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "User";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MembersContent() {
  const { user, isAuthenticated } = useSessionStore();
  const router = useRouter();
  const { data: myMess, isLoading: messLoading } =
    useGetMyMess(isAuthenticated);

  const [filters, setFilters] = useState<MemberFilters>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [roleDialogMember, setRoleDialogMember] =
    useState<MemberData | null>(null);
  const [removeDialogMember, setRemoveDialogMember] =
    useState<MemberData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const { data: members = [], isLoading: membersLoading } = useMembers(
    messId,
    filters,
  );

  const addMember = useAddMember(messId ?? "");
  const removeMember = useRemoveMember(messId ?? "");
  const updateMemberRole = useUpdateMemberRole(messId ?? "");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (addMember.isSuccess) {
      setAddDialogOpen(false);
      setSuccessMessage("Member added successfully");
      setErrorMessage(null);
      addMember.reset();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    if (addMember.isError) {
      setErrorMessage(
        addMember.error?.message?.includes("already a member")
          ? "User is already a member of this mess"
          : "Failed to add member. Please try again.",
      );
      addMember.reset();
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [addMember.isSuccess, addMember.isError, addMember.error, addMember]);

  useEffect(() => {
    if (removeMember.isSuccess) {
      setRemoveDialogMember(null);
      setSuccessMessage("Member removed successfully");
      setErrorMessage(null);
      removeMember.reset();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    if (removeMember.isError) {
      setErrorMessage(
        removeMember.error?.message?.includes("last manager")
          ? "Cannot remove the last manager"
          : "Failed to remove member. Please try again.",
      );
      removeMember.reset();
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [removeMember.isSuccess, removeMember.isError, removeMember.error, removeMember]);

  useEffect(() => {
    if (updateMemberRole.isSuccess) {
      setRoleDialogMember(null);
      setSuccessMessage("Member role updated successfully");
      setErrorMessage(null);
      updateMemberRole.reset();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    if (updateMemberRole.isError) {
      setErrorMessage(
        updateMemberRole.error?.message?.includes("Maximum 2 managers")
          ? "Maximum 2 managers allowed per mess"
          : updateMemberRole.error?.message?.includes("last manager")
            ? "Cannot demote the last manager"
            : "Failed to update role. Please try again.",
      );
      updateMemberRole.reset();
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [updateMemberRole.isSuccess, updateMemberRole.isError, updateMemberRole.error, updateMemberRole]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:ml-72 lg:pb-8">
      <Sidebar />
      <main className="px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Members
              </p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                Mess Members
              </h1>
            </div>
            {isManager && (
              <button
                type="button"
                onClick={() => setAddDialogOpen(true)}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Add Member
              </button>
            )}
          </div>

          {successMessage && (
            <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {messLoading || membersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-surface"
                />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-xl border border-foreground-muted/15 bg-surface p-12 text-center">
              <p className="text-lg font-semibold text-foreground">
                No members found
              </p>
              <p className="mt-2 text-sm text-foreground-muted">
                {isManager
                  ? "Add members to your mess to get started."
                  : "No members in this mess yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value || undefined,
                    }))
                  }
                  className="flex-1 rounded-lg border border-foreground-muted/20 bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
                />
                <select
                  value={filters.role ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      role: (e.target.value as "MANAGER" | "MEMBER") || undefined,
                    }))
                  }
                  className="rounded-lg border border-foreground-muted/20 bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="MANAGER">Manager</option>
                  <option value="MEMBER">Member</option>
                </select>
                <select
                  value={filters.status ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: (e.target.value as "ACTIVE" | "REMOVED") || undefined,
                    }))
                  }
                  className="rounded-lg border border-foreground-muted/20 bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="REMOVED">Removed</option>
                </select>
              </div>

              <div className="overflow-x-auto rounded-xl border border-foreground-muted/15 bg-surface">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-foreground-muted/10">
                      <th className="px-4 py-3 font-semibold text-foreground">
                        Member
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground">
                        Role
                      </th>
                      <th className="hidden px-4 py-3 font-semibold text-foreground md:table-cell">
                        Joined
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground">
                        Status
                      </th>
                      {isManager && (
                        <th className="px-4 py-3 font-semibold text-foreground">
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
                        <td className="px-4 py-3">
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
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="hidden px-4 py-3 text-foreground-muted md:table-cell">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
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
                          <td className="px-4 py-3">
                            {!member.removed_at && member.user_id !== user?.id && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRoleDialogMember(member)}
                                  className="rounded-lg border border-foreground-muted/20 px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                                >
                                  Change Role
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRemoveDialogMember(member)
                                  }
                                  className="rounded-lg border border-destructive/20 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
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
            </div>
          )}
        </div>
      </main>

      <BottomNav />

      {addDialogOpen && (
        <AddMemberDialog
          onClose={() => setAddDialogOpen(false)}
          onAdd={(userId) => addMember.mutate(userId)}
          isPending={addMember.isPending}
        />
      )}

      {roleDialogMember && (
        <RoleChangeDialog
          member={roleDialogMember}
          managerCount={
            members.filter(
              (m) => m.mess_role === "MANAGER" && !m.removed_at,
            ).length
          }
          onClose={() => setRoleDialogMember(null)}
          onConfirm={(role) =>
            updateMemberRole.mutate({
              userId: roleDialogMember.user_id,
              role,
            })
          }
          isPending={updateMemberRole.isPending}
        />
      )}

      {removeDialogMember && (
        <RemoveMemberDialog
          member={removeDialogMember}
          onClose={() => setRemoveDialogMember(null)}
          onConfirm={() => removeMember.mutate(removeDialogMember.user_id)}
          isPending={removeMember.isPending}
        />
      )}
    </div>
  );
}

function AddMemberDialog({
  onClose,
  onAdd,
  isPending,
}: {
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

  const { data: searchResults = [], isLoading: searching } =
    useSearchUsers(searchQuery);

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

            {searching && (
              <p className="text-sm text-foreground-muted">Searching...</p>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="mb-4 max-h-60 overflow-y-auto">
                {searchResults.map((u) => (
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
              searchQuery.length >= 2 &&
              searchResults.length === 0 && (
                <p className="mb-4 text-sm text-foreground-muted">
                  No users found
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

function RoleChangeDialog({
  member,
  managerCount,
  onClose,
  onConfirm,
  isPending,
}: {
  member: MemberData;
  managerCount: number;
  onClose: () => void;
  onConfirm: (role: "MANAGER" | "MEMBER") => void;
  isPending: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<"MANAGER" | "MEMBER">(
    member.mess_role,
  );

  const isCurrentManager = member.mess_role === "MANAGER";
  const isLastManager = isCurrentManager && managerCount <= 1;
  const isMaxManagers = !isCurrentManager && managerCount >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-foreground-muted/15 bg-background p-6">
        <h2 className="mb-2 text-lg font-bold text-foreground">Change Role</h2>
        <p className="mb-4 text-sm text-foreground-muted">
          Update role for {member.user.name}
        </p>

        <div className="mb-4 space-y-2">
          <label
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              selectedRole === "MANAGER"
                ? "border-primary bg-primary/10"
                : "border-foreground-muted/20 hover:bg-surface-raised"
            } ${isMaxManagers ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="role"
              value="MANAGER"
              checked={selectedRole === "MANAGER"}
              onChange={() => !isMaxManagers && setSelectedRole("MANAGER")}
              disabled={isMaxManagers}
              className="accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Manager</p>
              <p className="text-xs text-foreground-muted">
                Can manage members, meals, and expenses
              </p>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              selectedRole === "MEMBER"
                ? "border-primary bg-primary/10"
                : "border-foreground-muted/20 hover:bg-surface-raised"
            } ${isLastManager ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="role"
              value="MEMBER"
              checked={selectedRole === "MEMBER"}
              onChange={() => !isLastManager && setSelectedRole("MEMBER")}
              disabled={isLastManager}
              className="accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">Member</p>
              <p className="text-xs text-foreground-muted">
                Can view data and add meal entries
              </p>
            </div>
          </label>
        </div>

        {isMaxManagers && (
          <p className="mb-4 text-xs text-destructive">
            Maximum 2 managers allowed per mess
          </p>
        )}

        {isLastManager && (
          <p className="mb-4 text-xs text-destructive">
            Cannot demote the last manager
          </p>
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
            onClick={() => onConfirm(selectedRole)}
            disabled={
              isPending || selectedRole === member.mess_role || isLastManager || isMaxManagers
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoveMemberDialog({
  member,
  onClose,
  onConfirm,
  isPending,
}: {
  member: MemberData;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-foreground-muted/15 bg-background p-6">
        <h2 className="mb-2 text-lg font-bold text-foreground">
          Remove Member
        </h2>
        <p className="mb-4 text-sm text-foreground-muted">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-foreground">
            {member.user.name}
          </span>{" "}
          from this mess? This action cannot be undone.
        </p>

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
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MembersPage() {
  return (
    <AuthInitializer>
      <MembersContent />
    </AuthInitializer>
  );
}
