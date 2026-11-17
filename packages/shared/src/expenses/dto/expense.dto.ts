import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

export const expenseTypeSchema = z.enum(["SHARED", "INDIVIDUAL"]);

export const createExpenseSchema = z
  .object({
    type: expenseTypeSchema,
    title: z
      .string()
      .trim()
      .min(1, ValidationMessage.TITLE_REQUIRED)
      .max(150, ValidationMessage.TITLE_MAX),
    amount: z
      .number()
      .positive(ValidationMessage.AMOUNT_POSITIVE)
      .max(100000000, ValidationMessage.AMOUNT_TOO_LARGE),
    expense_date: z.string().datetime(ValidationMessage.DATE_INVALID),
    member_ids: z
      .array(z.string().uuid(ValidationMessage.MEMBER_ID_INVALID))
      .min(1, ValidationMessage.MEMBERS_REQUIRED),
  })
  .superRefine((data, ctx) => {
    if (data.type === "INDIVIDUAL" && data.member_ids.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["member_ids"],
        message: ValidationMessage.INDIVIDUAL_ONE_MEMBER,
      });
    }
  });

export const updateExpenseSchema = z
  .object({
    type: expenseTypeSchema.optional(),
    title: z
      .string()
      .trim()
      .min(1, ValidationMessage.TITLE_REQUIRED)
      .max(150, ValidationMessage.TITLE_MAX)
      .optional(),
    amount: z
      .number()
      .positive(ValidationMessage.AMOUNT_POSITIVE)
      .max(100000000, ValidationMessage.AMOUNT_TOO_LARGE)
      .optional(),
    expense_date: z
      .string()
      .datetime(ValidationMessage.DATE_INVALID)
      .optional(),
    member_ids: z
      .array(z.string().uuid(ValidationMessage.MEMBER_ID_INVALID))
      .min(1, ValidationMessage.MEMBERS_REQUIRED)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "INDIVIDUAL" && data.member_ids) {
      if (data.member_ids.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["member_ids"],
          message: ValidationMessage.INDIVIDUAL_ONE_MEMBER,
        });
      }
    }
  });

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
