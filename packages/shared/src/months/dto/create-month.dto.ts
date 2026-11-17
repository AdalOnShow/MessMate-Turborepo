import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

/**
 * What to carry into the new month when the active one closes (ADR-008).
 * Left out: every member's balance is carried, as before.
 */
export const carryForwardOptionsSchema = z.object({
  /** false: start the new month with no carried balances for anyone. */
  enabled: z.boolean(),
  /** Members whose balance is not carried (e.g. settled in cash). */
  excludeMemberIds: z
    .array(z.string().uuid(ValidationMessage.MEMBER_ID_INVALID))
    .max(500)
    .default([]),
});

export const createMonthSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, ValidationMessage.MONTH_TITLE_REQUIRED)
    .max(100, ValidationMessage.MONTH_TITLE_MAX)
    .optional(),
  carryForward: carryForwardOptionsSchema.optional(),
});

export type CarryForwardOptions = z.infer<typeof carryForwardOptionsSchema>;
export type CreateMonthDto = z.infer<typeof createMonthSchema>;
