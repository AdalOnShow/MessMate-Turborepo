/**
 * Success toasts for mutations (`meta: { successMessage: "expenseAdded" }`).
 * `ErrorTranslatorBridge` registers the `feedback.success` translator; the
 * English text here is the fallback until it does.
 */
const SUCCESS_MESSAGES = {
  expenseAdded: "Expense added",
  expenseUpdated: "Expense updated",
  expenseDeleted: "Expense deleted",
  messCreated: "Mess created",
  messSettingsSaved: "Mess settings saved",
  mealTypeUpdated: "Meal type updated",
  mealTypeAdded: "Meal type added",
  mealTypeDeleted: "Meal type deleted",
  bazaarSubmittedForApproval: "Bazaar submitted for approval",
  bazaarUpdated: "Bazaar updated",
  bazaarDeleted: "Bazaar deleted",
  bazaarApproved: "Bazaar approved",
  bazaarRejected: "Bazaar rejected",
  inviteSent: "Invite sent",
  inviteAccepted: "Invite accepted",
  inviteDeclined: "Invite declined",
  newMonthStarted: "New month started",
  depositAdded: "Deposit added",
  depositUpdated: "Deposit updated",
  depositDeleted: "Deposit deleted",
  memberRemoved: "Member removed",
  memberRoleUpdated: "Member role updated",
  mealsSaved: "Meals saved",
  mealsUpdated: "Meals updated",
  mealEntryDeleted: "Meal entry deleted",
  profileUpdated: "Profile updated",
  passwordChanged: "Password changed",
  profilePhotoUpdated: "Profile photo updated",
  profilePhotoRemoved: "Profile photo removed",
} as const;

export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES;

type Translator = {
  (key: string): string;
  has: (key: string) => boolean;
};

let translator: Translator | null = null;

export function setSuccessTranslator(t: Translator | null) {
  translator = t;
}

export function successText(key: SuccessMessageKey): string {
  if (translator?.has(key)) return translator(key);
  return SUCCESS_MESSAGES[key];
}
