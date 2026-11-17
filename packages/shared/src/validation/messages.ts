/**
 * Every validation message used by the shared Zod schemas.
 *
 * The API returns these English strings in `details` (`{ field: message }`),
 * and the web app shows them next to the field. Because each message is a
 * fixed string from this table, the web app can look up its key with
 * `validationMessageKey()` and show a translated version instead
 * (`feedback.errors.validation.<KEY>` in `apps/web/messages`).
 *
 * Add new messages here, never as inline string literals in a schema, and
 * add the translation for every locale.
 */
export const ValidationMessage = {
  // Email & password
  EMAIL_INVALID: "Enter a valid email address",
  PASSWORD_REQUIRED: "Password is required",
  CURRENT_PASSWORD_REQUIRED: "Current password is required",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  PASSWORD_MIN: "Password must be at least 8 characters",
  PASSWORD_MAX: "Password must be at most 100 characters",
  PASSWORD_UPPERCASE: "Password must include an uppercase letter (A-Z)",
  PASSWORD_LOWERCASE: "Password must include a lowercase letter (a-z)",
  PASSWORD_NUMBER: "Password must include a number (0-9)",
  PASSWORD_SAME_AS_CURRENT:
    "New password must be different from your current password",

  // People
  NAME_MIN: "Name must be at least 2 characters",
  NAME_MAX: "Name must be at most 80 characters",
  PHONE_MAX: "Phone number must be at most 20 characters",
  INVITE_TARGET_REQUIRED: "Provide either a user or an email address",

  // Mess
  MESS_ID_INVALID: "Invalid mess ID",
  MESS_NAME_MIN: "Mess name must be at least 2 characters",
  MESS_NAME_MAX: "Mess name must be at most 80 characters",
  DESCRIPTION_MAX_300: "Description must be at most 300 characters",
  DESCRIPTION_MAX_500: "Description must be at most 500 characters",
  SLUG_MIN: "Slug must be at least 2 characters",
  SLUG_MAX: "Slug must be at most 80 characters",
  SLUG_FORMAT: "Slug must contain only lowercase letters, numbers, and hyphens",

  // Meal types & meals
  MEAL_TYPE_NAME_REQUIRED: "Name cannot be empty",
  MEAL_TYPE_NAME_MAX: "Name must be at most 50 characters",
  MEAL_TYPE_VALUE_MIN: "Value must be at least 0",
  MEAL_TYPE_VALUE_MAX: "Value must be at most 10",
  MEAL_TYPE_ID_INVALID: "Invalid meal type ID",
  MEAL_VALUE_MIN: "Meal value must be at least 0",
  MEAL_VALUE_MAX: "Meal value must be at most 10",
  MEAL_TYPES_REQUIRED: "At least one meal type is required",
  MEAL_ENTRIES_REQUIRED: "At least one entry is required",
  MEAL_ENTRIES_TOO_MANY: "Too many entries in one save",

  // Months
  MONTH_TITLE_REQUIRED: "Title cannot be empty",
  MONTH_TITLE_MAX: "Title must be at most 100 characters",

  // Money
  TITLE_REQUIRED: "Title is required",
  TITLE_MAX: "Title must be at most 150 characters",
  AMOUNT_NOT_NEGATIVE: "Amount cannot be negative",
  AMOUNT_POSITIVE: "Amount must be greater than zero",
  AMOUNT_TOO_LARGE: "Amount is too large",
  DATE_INVALID: "Invalid date format",
  MEMBER_ID_INVALID: "Invalid member id",
  MEMBERS_REQUIRED: "At least one member must be selected",
  INDIVIDUAL_ONE_MEMBER:
    "Individual expenses must be assigned to exactly one member",

  // Bazaar
  ITEM_NAME_REQUIRED: "Item name is required",
  ITEM_NAME_MAX: "Item name must be at most 100 characters",
  ITEMS_LIST: "Items must be a list of bazaar items",
  ITEMS_REQUIRED: "At least one item is required",
  STATUS_INVALID: "Invalid status",
  CURSOR_INVALID: "Invalid cursor",
  LIMIT_MIN: "Limit must be at least 1",
  LIMIT_MAX: "Limit must be at most 50",
} as const;

export type ValidationMessageKey = keyof typeof ValidationMessage;

const keyByMessage = new Map<string, ValidationMessageKey>(
  (Object.entries(ValidationMessage) as [ValidationMessageKey, string][]).map(
    ([key, message]) => [message, key],
  ),
);

/** The `ValidationMessage` key for a message, or null if it is not one. */
export function validationMessageKey(
  message: string,
): ValidationMessageKey | null {
  return keyByMessage.get(message) ?? null;
}
