import { z } from "zod";
import { ValidationMessage } from "./messages";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

/** One rule of the password policy, for live checklists in forms. */
export type PasswordRule = "length" | "uppercase" | "lowercase" | "number";

const RULE_TESTS: Record<PasswordRule, (value: string) => boolean> = {
  length: (v) => v.length >= PASSWORD_MIN_LENGTH,
  uppercase: (v) => /[A-Z]/.test(v),
  lowercase: (v) => /[a-z]/.test(v),
  number: (v) => /[0-9]/.test(v),
};

export const PASSWORD_RULES = Object.keys(RULE_TESTS) as PasswordRule[];

/** Which rules a password meets, e.g. `{ length: true, uppercase: false }`. */
export function checkPassword(value: string): Record<PasswordRule, boolean> {
  return {
    length: RULE_TESTS.length(value),
    uppercase: RULE_TESTS.uppercase(value),
    lowercase: RULE_TESTS.lowercase(value),
    number: RULE_TESTS.number(value),
  };
}

/**
 * Policy for every password a person chooses (sign-up, change password,
 * manager-created accounts). Sign-in only checks that one was typed, so
 * accounts created under an older policy can still sign in.
 */
export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, ValidationMessage.PASSWORD_MIN)
  .max(PASSWORD_MAX_LENGTH, ValidationMessage.PASSWORD_MAX)
  .regex(/[A-Z]/, ValidationMessage.PASSWORD_UPPERCASE)
  .regex(/[a-z]/, ValidationMessage.PASSWORD_LOWERCASE)
  .regex(/[0-9]/, ValidationMessage.PASSWORD_NUMBER);
