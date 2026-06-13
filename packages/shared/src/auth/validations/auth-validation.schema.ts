import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

type AuthValidationSchema = Record<string, readonly PropertyDecorator[]>;

export const signInValidationSchema = {
  email: [IsString(), IsEmail(), IsNotEmpty()],
  password: [IsString(), IsNotEmpty()],
} as const satisfies AuthValidationSchema;

export const signUpValidationSchema = {
  name: [IsString(), IsNotEmpty(), MinLength(2), MaxLength(80)],
  email: [IsString(), IsEmail(), IsNotEmpty()],
  password: [IsString(), IsNotEmpty(), MinLength(8), MaxLength(100)],
  phone: [IsOptional(), IsString(), MaxLength(20)],
} as const satisfies AuthValidationSchema;

export function applyValidationRules(
  ...decorators: readonly PropertyDecorator[]
): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    for (const decorator of decorators) {
      decorator(target, propertyKey);
    }
  };
}
