export function MembersFeedback({
  successMessage,
  errorMessage,
}: {
  successMessage: string | null;
  errorMessage: string | null;
}) {
  if (!successMessage && !errorMessage) return null;

  return (
    <div className="mb-4 space-y-2">
      {successMessage && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
