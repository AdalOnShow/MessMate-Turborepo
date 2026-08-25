import { z } from "zod";

export const mealEntryItemSchema = z.object({
  memberId: z.string().uuid(),
  date: z.string().datetime(),
  meals: z.record(z.string().uuid(), z.number().min(0).max(10)),
});

export const bulkMealEntriesSchema = z.object({
  entries: z
    .array(mealEntryItemSchema)
    .min(1, "At least one entry is required"),
});

export type BulkMealEntriesDto = z.infer<typeof bulkMealEntriesSchema>;

export interface MealEntryResponse {
  id: string;
  month_id: string;
  member_id: string;
  date: string;
  meals: Record<string, number>;
  total_meal: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MealEntryWithMember extends MealEntryResponse {
  member: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  };
}
