import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

export const defaultMealItemSchema = z.object({
  mealTypeId: z.string().uuid(ValidationMessage.MEAL_TYPE_ID_INVALID),
  mealValue: z
    .number()
    .min(0, ValidationMessage.MEAL_VALUE_MIN)
    .max(10, ValidationMessage.MEAL_VALUE_MAX),
});

export const updateDefaultMealsSchema = z.object({
  meals: z
    .array(defaultMealItemSchema)
    .min(1, ValidationMessage.MEAL_TYPES_REQUIRED),
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
