import { z } from "zod";

export const bazaarItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(100, "Item name must be at most 100 characters"),
  amount: z
    .number()
    .nonnegative("Amount must be a positive number")
    .max(100000000, "Amount is too large"),
});

export const createBazaarSchema = z.object({
  items: z
    .array(bazaarItemSchema, "Items must be a list of bazaar items")
    .min(1, "At least one item is required"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  expense_date: z.string().datetime("Invalid date format"),
});

export const updateBazaarSchema = z.object({
  items: z
    .array(bazaarItemSchema, "Items must be a list of bazaar items")
    .min(1, "At least one item is required")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  expense_date: z.string().datetime("Invalid date format").optional(),
});

export type CreateBazaarDto = z.infer<typeof createBazaarSchema>;
export type UpdateBazaarDto = z.infer<typeof updateBazaarSchema>;

export const BAZAAR_PAGE_SIZE = 4;

/**
 * Query for one page of bazaar submissions in a single status tab.
 * `cursor` is the opaque `next_cursor` from the previous page.
 */
export const listBazaarQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"], "Invalid status"),
  cursor: z.string().max(100, "Invalid cursor").optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(BAZAAR_PAGE_SIZE),
});

export type ListBazaarQueryDto = z.infer<typeof listBazaarQuerySchema>;
