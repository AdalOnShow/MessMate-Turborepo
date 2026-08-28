import { z } from "zod";

export const createDepositSchema = z.object({
  member_id: z.string().uuid("Invalid member id"),
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(100000000, "Amount is too large"),
  deposit_date: z.string().datetime("Invalid date format"),
});

export const updateDepositSchema = z.object({
  member_id: z.string().uuid("Invalid member id").optional(),
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(100000000, "Amount is too large")
    .optional(),
  deposit_date: z.string().datetime("Invalid date format").optional(),
});

export type CreateDepositDto = z.infer<typeof createDepositSchema>;
export type UpdateDepositDto = z.infer<typeof updateDepositSchema>;
