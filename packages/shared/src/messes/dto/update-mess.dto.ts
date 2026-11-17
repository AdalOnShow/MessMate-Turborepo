import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

export const updateMessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, ValidationMessage.NAME_MIN)
    .max(80, ValidationMessage.NAME_MAX)
    .optional(),
  description: z
    .union([
      z.string().trim().max(300, ValidationMessage.DESCRIPTION_MAX_300),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((value) => {
      if (value === "" || value == null) {
        return undefined;
      }
      return value;
    }),
  slug: z
    .string()
    .trim()
    .min(2, ValidationMessage.SLUG_MIN)
    .max(80, ValidationMessage.SLUG_MAX)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, ValidationMessage.SLUG_FORMAT)
    .optional(),
});

export type UpdateMessDto = z.infer<typeof updateMessSchema>;
