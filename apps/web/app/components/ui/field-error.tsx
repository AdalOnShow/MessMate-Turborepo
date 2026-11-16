import { AlertCircle } from "lucide-react";

/** Short red note shown under a form field that needs fixing. */
export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <span
      id={id}
      role="alert"
      className="animate-fade-in mt-1.5 flex items-start gap-1.5 text-sm text-destructive"
    >
      <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </span>
  );
}

/** Red border for an input with a field error. */
export const invalidInput =
  "border-destructive focus:border-destructive focus:ring-destructive/15";
