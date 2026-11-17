import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

export const createDepositSchema = z.object({
  member_id: z.string().uuid(ValidationMessage.MEMBER_ID_INVALID),
  amount: z
    .number()
    .positive(ValidationMessage.AMOUNT_POSITIVE)
    .max(100000000, ValidationMessage.AMOUNT_TOO_LARGE),
  deposit_date: z.string().datetime(ValidationMessage.DATE_INVALID),
});

export const updateDepositSchema = z.object({
  member_id: z.string().uuid(ValidationMessage.MEMBER_ID_INVALID).optional(),
  amount: z
    .number()
    .positive(ValidationMessage.AMOUNT_POSITIVE)
    .max(100000000, ValidationMessage.AMOUNT_TOO_LARGE)
    .optional(),
  deposit_date: z.string().datetime(ValidationMessage.DATE_INVALID).optional(),
});

export type CreateDepositDto = z.infer<typeof createDepositSchema>;
export type UpdateDepositDto = z.infer<typeof updateDepositSchema>;
