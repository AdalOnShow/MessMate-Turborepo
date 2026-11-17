import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

export const bazaarItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, ValidationMessage.ITEM_NAME_REQUIRED)
    .max(100, ValidationMessage.ITEM_NAME_MAX),
  amount: z
    .number()
    .nonnegative(ValidationMessage.AMOUNT_NOT_NEGATIVE)
    .max(100000000, ValidationMessage.AMOUNT_TOO_LARGE),
});

export const createBazaarSchema = z.object({
  items: z
    .array(bazaarItemSchema, ValidationMessage.ITEMS_LIST)
    .min(1, ValidationMessage.ITEMS_REQUIRED),
  description: z
    .string()
    .trim()
    .max(500, ValidationMessage.DESCRIPTION_MAX_500)
    .optional(),
  expense_date: z.string().datetime(ValidationMessage.DATE_INVALID),
});

export const updateBazaarSchema = z.object({
  items: z
    .array(bazaarItemSchema, ValidationMessage.ITEMS_LIST)
    .min(1, ValidationMessage.ITEMS_REQUIRED)
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, ValidationMessage.DESCRIPTION_MAX_500)
    .optional(),
  expense_date: z.string().datetime(ValidationMessage.DATE_INVALID).optional(),
});

export type CreateBazaarDto = z.infer<typeof createBazaarSchema>;
export type UpdateBazaarDto = z.infer<typeof updateBazaarSchema>;

export const BAZAAR_PAGE_SIZE = 4;

/**
 * Query for one page of bazaar submissions in a single status tab.
 * `cursor` is the opaque `next_cursor` from the previous page.
 */
export const listBazaarQuerySchema = z.object({
  status: z.enum(
    ["PENDING", "APPROVED", "REJECTED"],
    ValidationMessage.STATUS_INVALID,
  ),
  cursor: z.string().max(100, ValidationMessage.CURSOR_INVALID).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, ValidationMessage.LIMIT_MIN)
    .max(50, ValidationMessage.LIMIT_MAX)
    .default(BAZAAR_PAGE_SIZE),
});

export type ListBazaarQueryDto = z.infer<typeof listBazaarQuerySchema>;
