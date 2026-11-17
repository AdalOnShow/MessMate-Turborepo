import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

export const createMessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, ValidationMessage.MESS_NAME_MIN)
    .max(80, ValidationMessage.MESS_NAME_MAX),
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
});

export type CreateMessDto = z.infer<typeof createMessSchema>;
