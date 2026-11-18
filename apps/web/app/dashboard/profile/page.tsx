"use client";

import { TipsPreference } from "../../components/help/PageTips";

import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Loader2,
  Save,
  Shield,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useSessionStore } from "../../store";
import {
  useChangePassword,
  useDeleteAvatar,
  useGetProfile,
  useUpdateProfile,
  useUploadAvatar,
} from "../../hooks/use-profile";
import { QueryErrorState } from "../../components/feedback/QueryErrorState";
import { PasswordChecklist } from "../../components/ui/password-checklist";
import { FieldError, invalidInput } from "../../components/ui/field-error";
import { OfflineHint } from "../../components/ui/offline-hint";
import { useOnline } from "../../hooks/use-online";
import { useFieldErrors } from "../../lib/field-errors";

function CompactAvatarUpload({
  currentAvatarUrl,
  userName,
}: {
  currentAvatarUrl: string | null | undefined;
  userName: string;
}) {
  const t = useTranslations("pages.profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const initials = (userName || "U").slice(0, 2).toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFileError(t("onlyJpegPngWebp"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError(t("fileMustSmallerThan"));
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!selectedFile) return;
    uploadAvatar.mutate(selectedFile, {
      onSuccess: () => {
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  const handleDiscard = () => {
    setSelectedFile(null);
    setPreview(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = () => {
    deleteAvatar.mutate();
  };

  const displaySrc = preview ?? currentAvatarUrl;
  const isBusy = uploadAvatar.isPending || deleteAvatar.isPending;

  return (
    <div className="mt-2 flex items-center gap-4">
      <div className="relative shrink-0">
        <div className="h-16 w-16 rounded-full overflow-hidden ring-4 ring-primary/20 ring-offset-2 ring-offset-surface">
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displaySrc}
              alt={`${userName}'s avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/15 text-primary text-xl font-bold">
              {initials}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          aria-label={t("changeAvatar")}
          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera size={16} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-label={t("uploadAvatar")}
      />

      <div className="flex-1 min-w-0">
        {fileError && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle size={13} />
            {fileError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {selectedFile ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isBusy}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadAvatar.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Upload size={13} />
                )}
                {t("saveAvatar")}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isBusy}
                className="flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={13} />
                {t("discard")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Camera size={13} />
                {t("changePhoto")}
              </button>
              {currentAvatarUrl && !preview && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isBusy}
                  className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteAvatar.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  {t("remove")}
                </button>
              )}
            </>
          )}
        </div>

        <p className="mt-1 text-xs text-foreground-muted">
          {t("jpegPngOrWebp")}
        </p>
      </div>
    </div>
  );
}

function ProfileContent() {
  const tt = useTranslations("tips.pref");
  const t = useTranslations("pages.profile");
  const { user, isAuthenticated } = useSessionStore();
  const profile = useGetProfile(isAuthenticated);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const profileErrors = useFieldErrors();
  const passwordErrors = useFieldErrors();
  const online = useOnline();

  useEffect(() => {
    const source = profile.data ?? user;
    if (!source) return;
    setName(source.name);
    setPhone(source.phone ?? "");
  }, [profile.data, user]);

  const activeUser = profile.data ?? user;

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate(
      {
        name,
        phone: phone.trim() ? phone.trim() : null,
      },
      { onError: (err) => profileErrors.fromServer(err) },
    );
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          passwordErrors.reset();
        },
        onError: (err) => passwordErrors.fromServer(err),
      },
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="label-mono text-primary">{t("profile")}</p>
        <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
          {t("accountSettings")}
        </h1>
      </div>

      {profile.isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-surface text-foreground-muted">
          <Loader2 className="mr-2 animate-spin" size={18} />
          {t("loadingProfile")}
        </div>
      ) : profile.isError && !profile.data ? (
        <QueryErrorState
          error={profile.error}
          onRetry={profile.refetch}
          isRetrying={profile.isFetching}
          resource="your profile"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleProfileSubmit}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <h2 className="text-xl font-semibold text-foreground">
              {t("personalDetails")}
            </h2>
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  {t("profilePhoto")}
                </span>
                <CompactAvatarUpload
                  currentAvatarUrl={activeUser?.avatar}
                  userName={activeUser?.name ?? ""}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  {t("name")}
                </span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    profileErrors.clear("name");
                  }}
                  aria-invalid={!!profileErrors.errors.name}
                  required
                  className={`mt-2 h-11 w-full rounded-lg border border-border bg-surface-sunken px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/15 ${profileErrors.errors.name ? invalidInput : ""}`}
                />
                <FieldError message={profileErrors.errors.name} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  {t("phone")}
                </span>
                <input
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    profileErrors.clear("phone");
                  }}
                  aria-invalid={!!profileErrors.errors.phone}
                  maxLength={20}
                  className={`mt-2 h-11 w-full rounded-lg border border-border bg-surface-sunken px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/15 ${profileErrors.errors.phone ? invalidInput : ""}`}
                  placeholder={t("addPhoneNumber")}
                />
                <FieldError message={profileErrors.errors.phone} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  {t("email")}
                </span>
                <input
                  value={activeUser?.email ?? ""}
                  readOnly
                  className="mt-2 h-11 w-full rounded-lg border border-border bg-background/60 px-3.5 text-sm text-foreground-muted outline-none"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={updateProfile.isPending || !online}
              className="mt-6 flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateProfile.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {t("saveChanges")}
            </button>
          </form>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Shield size={20} className="text-primary" />
                {t("accountStatus")}
              </h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-foreground-muted">
                    {t("managerCreated")}
                  </dt>
                  <dd className="font-semibold text-foreground">
                    {activeUser?.manager_created ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-foreground-muted">
                    {t("emailVerified")}
                  </dt>
                  <dd className="font-semibold text-foreground">
                    {activeUser?.email_verified ? "Yes" : "No"}
                  </dd>
                </div>
              </dl>
            </div>

            <section
              id="preferences"
              className="scroll-mt-20 rounded-xl border border-border bg-surface p-6"
            >
              <h2 className="text-xl font-semibold text-foreground">
                {tt("title")}
              </h2>
              <div className="mt-4">
                <TipsPreference />
              </div>
            </section>

            <form
              onSubmit={handlePasswordSubmit}
              className="rounded-xl border border-border bg-surface p-6"
            >
              <h2 className="text-xl font-semibold text-foreground">
                {t("changePassword")}
              </h2>
              <div className="mt-6 space-y-5">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    {t("currentPassword")}
                  </span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      passwordErrors.clear("currentPassword");
                    }}
                    aria-invalid={!!passwordErrors.errors.currentPassword}
                    required
                    className={`mt-2 h-11 w-full rounded-lg border border-border bg-surface-sunken px-3.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 ${passwordErrors.errors.currentPassword ? invalidInput : ""}`}
                  />
                  <FieldError message={passwordErrors.errors.currentPassword} />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">
                    {t("newPassword")}
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      passwordErrors.clear("newPassword");
                    }}
                    aria-invalid={!!passwordErrors.errors.newPassword}
                    required
                    minLength={8}
                    className={`mt-2 h-11 w-full rounded-lg border border-border bg-surface-sunken px-3.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 ${passwordErrors.errors.newPassword ? invalidInput : ""}`}
                  />
                  <FieldError message={passwordErrors.errors.newPassword} />
                  <PasswordChecklist password={newPassword} />
                </label>
              </div>

              <button
                type="submit"
                disabled={changePassword.isPending || !online}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary/40 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changePassword.isPending && (
                  <Loader2 className="animate-spin" size={16} />
                )}
                {t("updatePassword")}
              </button>
              <OfflineHint />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}
