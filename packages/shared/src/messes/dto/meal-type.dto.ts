import { z } from "zod";

export const updateMealTypeSchema = z.object({
  value: z
    .number()
    .min(0, "Value must be at least 0")
    .max(10, "Value must be at most 10")
    .optional(),
  is_active: z.boolean().optional(),
});

export type UpdateMealTypeDto = z.infer<typeof updateMealTypeSchema>;

export interface MealTypeResponse {
  id: string;
  mess_id: string;
  name: string;
  value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
