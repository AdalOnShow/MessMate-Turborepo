"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save, Shield } from "lucide-react";
import { AuthInitializer } from "../components/AuthInitializer";
import { Sidebar } from "../components/dashboard/Sidebar";
import { useSessionStore } from "../store";
import {
  useChangePassword,
  useGetProfile,
  useUpdateProfile,
} from "../hooks/use-profile";
import { useRouter } from "next/navigation";

function ProfileContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useSessionStore();
  const profile = useGetProfile(isAuthenticated);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const source = profile.data ?? user;
    if (!source) return;
    setName(source.name);
    setPhone(source.phone ?? "");
  }, [profile.data, user]);

  if (!isAuthenticated) {
    return null;
  }

  const activeUser = profile.data ?? user;

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate({
      name,
      phone: phone.trim() ? phone.trim() : null,
    });
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="px-4 py-8 lg:ml-72 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Profile
              </p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                Account settings
              </h1>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-foreground-muted/15 bg-surface px-4 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary">
                {(activeUser?.name || activeUser?.email || "U")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {activeUser?.name || "Profile"}
                </p>
                <p className="text-sm text-foreground-muted">
                  {activeUser?.email}
                </p>
              </div>
            </div>
          </div>

          {profile.isLoading ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-foreground-muted/15 bg-surface text-foreground-muted">
              <Loader2 className="mr-2 animate-spin" size={18} />
              Loading profile
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              <form
                onSubmit={handleProfileSubmit}
                className="rounded-xl border border-foreground-muted/15 bg-surface p-6"
              >
                <h2 className="text-xl font-semibold text-foreground">
                  Personal details
                </h2>
                <div className="mt-6 space-y-5">
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">
                      Name
                    </span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      className="mt-2 h-11 w-full rounded-lg border border-foreground-muted/15 bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted/50 focus:border-primary/60"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">
                      Phone
                    </span>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      maxLength={30}
                      className="mt-2 h-11 w-full rounded-lg border border-foreground-muted/15 bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted/50 focus:border-primary/60"
                      placeholder="Add a phone number"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">
                      Email
                    </span>
                    <input
                      value={activeUser?.email ?? ""}
                      readOnly
                      className="mt-2 h-11 w-full rounded-lg border border-foreground-muted/15 bg-background/60 px-3.5 text-sm text-foreground-muted outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">
                      Avatar URL
                    </span>
                    <input
                      value={activeUser?.avatar ?? ""}
                      readOnly
                      className="mt-2 h-11 w-full rounded-lg border border-foreground-muted/15 bg-background/60 px-3.5 text-sm text-foreground-muted outline-none"
                      placeholder="No avatar set"
                    />
                  </label>
                </div>

                {updateProfile.error && (
                  <p className="mt-5 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle size={16} />
                    {updateProfile.error.message}
                  </p>
                )}
                {updateProfile.isSuccess && (
                  <p className="mt-5 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle2 size={16} />
                    Profile updated
                  </p>
                )}

                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="mt-6 flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Save changes
                </button>
              </form>

              <div className="space-y-6">
                <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                    <Shield size={20} className="text-primary" />
                    Account status
                  </h2>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-foreground-muted">Manager created</dt>
                      <dd className="font-semibold text-foreground">
                        {activeUser?.manager_created ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-foreground-muted">Email verified</dt>
                      <dd className="font-semibold text-foreground">
                        {activeUser?.email_verified ? "Yes" : "No"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <form
                  onSubmit={handlePasswordSubmit}
                  className="rounded-xl border border-foreground-muted/15 bg-surface p-6"
                >
                  <h2 className="text-xl font-semibold text-foreground">
                    Change password
                  </h2>
                  <div className="mt-6 space-y-5">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">
                        Current password
                      </span>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(event) =>
                          setCurrentPassword(event.target.value)
                        }
                        required
                        className="mt-2 h-11 w-full rounded-lg border border-foreground-muted/15 bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">
                        New password
                      </span>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        required
                        minLength={8}
                        className="mt-2 h-11 w-full rounded-lg border border-foreground-muted/15 bg-background px-3.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                      />
                    </label>
                  </div>

                  {changePassword.error && (
                    <p className="mt-5 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <AlertCircle size={16} />
                      {changePassword.error.message}
                    </p>
                  )}
                  {changePassword.isSuccess && (
                    <p className="mt-5 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                      <CheckCircle2 size={16} />
                      Password changed
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={changePassword.isPending}
                    className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary/40 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {changePassword.isPending && (
                      <Loader2 className="animate-spin" size={16} />
                    )}
                    Update password
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthInitializer>
      <ProfileContent />
    </AuthInitializer>
  );
}
