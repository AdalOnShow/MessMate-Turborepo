import { z } from "zod";

export const expenseTypeSchema = z.enum(["SHARED", "INDIVIDUAL"]);

export const createExpenseSchema = z
  .object({
    type: expenseTypeSchema,
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(150, "Title must be at most 150 characters"),
    amount: z
      .number()
      .positive("Amount must be greater than zero")
      .max(100000000, "Amount is too large"),
    expense_date: z.string().datetime("Invalid date format"),
    member_ids: z
      .array(z.string().uuid("Invalid member id"))
      .min(1, "At least one member must be selected"),
  })
  .superRefine((data, ctx) => {
    if (data.type === "INDIVIDUAL" && data.member_ids.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["member_ids"],
        message: "Individual expenses must be assigned to exactly one member",
      });
    }
  });

export const updateExpenseSchema = z
  .object({
    type: expenseTypeSchema.optional(),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(150, "Title must be at most 150 characters")
      .optional(),
    amount: z
      .number()
      .positive("Amount must be greater than zero")
      .max(100000000, "Amount is too large")
      .optional(),
    expense_date: z.string().datetime("Invalid date format").optional(),
    member_ids: z
      .array(z.string().uuid("Invalid member id"))
      .min(1, "At least one member must be selected")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "INDIVIDUAL" && data.member_ids) {
      if (data.member_ids.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["member_ids"],
          message: "Individual expenses must be assigned to exactly one member",
        });
      }
    }
  });

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
