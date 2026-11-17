import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

export const createMonthSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, ValidationMessage.MONTH_TITLE_REQUIRED)
    .max(100, ValidationMessage.MONTH_TITLE_MAX)
    .optional(),
});

export type CreateMonthDto = z.infer<typeof createMonthSchema>;
