import { z } from "zod";
import { ValidationMessage } from "../../validation/messages";

export const createMealTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, ValidationMessage.MEAL_TYPE_NAME_REQUIRED)
    .max(50, ValidationMessage.MEAL_TYPE_NAME_MAX),
  value: z
    .number()
    .min(0, ValidationMessage.MEAL_TYPE_VALUE_MIN)
    .max(10, ValidationMessage.MEAL_TYPE_VALUE_MAX),
});

export type CreateMealTypeDto = z.infer<typeof createMealTypeSchema>;

export const updateMealTypeSchema = z.object({
  value: z
    .number()
    .min(0, ValidationMessage.MEAL_TYPE_VALUE_MIN)
    .max(10, ValidationMessage.MEAL_TYPE_VALUE_MAX)
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
