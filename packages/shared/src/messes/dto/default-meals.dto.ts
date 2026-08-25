import { z } from "zod";

export const defaultMealItemSchema = z.object({
  mealTypeId: z.string().uuid("Invalid meal type ID"),
  mealValue: z
    .number()
    .min(0, "Meal value must be at least 0")
    .max(10, "Meal value must be at most 10"),
});

export const updateDefaultMealsSchema = z.object({
  meals: z
    .array(defaultMealItemSchema)
    .min(1, "At least one meal type is required"),
});

export type UpdateDefaultMealsDto = z.infer<typeof updateDefaultMealsSchema>;

export const defaultMealResponseSchema = z.object({
  id: z.string(),
  mess_id: z.string(),
  meal_type_id: z.string(),
  meal_value: z.number(),
  created_at: z.string(),
  meal_type: z.object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
    is_active: z.boolean(),
  }),
});

export type DefaultMealResponse = z.infer<typeof defaultMealResponseSchema>;
