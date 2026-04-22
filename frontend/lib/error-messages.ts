

export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  SAVE_FAILED: 'Failed to save. Please try again.',
  LOAD_FAILED: 'Failed to load data. Please refresh the page.',
  UPDATE_FAILED: 'Failed to update. Please try again.',
  DELETE_FAILED: 'Failed to delete. Please try again.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  INVALID_INPUT: 'Invalid input. Please check your entry.',
  REQUIRED_FIELD: 'This field is required.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  ONBOARDING_LOAD_FAILED: 'Failed to load onboarding data.',
  ONBOARDING_SAVE_FAILED: 'Failed to save onboarding progress.',
  PANIC_LOG_FAILED: 'Failed to save trigger log. Your progress was saved locally.',
  PANIC_METHOD_ERROR: 'An error occurred with the panic method. Please try again.',
  SETTINGS_LOAD_FAILED: 'Failed to load settings.',
  SETTINGS_SAVE_FAILED: 'Failed to save settings.',
  DATA_EXPORT_FAILED: 'Failed to export data. Please try again.',
  ACCOUNT_DELETE_FAILED: 'Failed to delete account. Please contact support.',
  CHAT_SEND_FAILED: 'Failed to send message. Please try again.',
  CHAT_LOAD_FAILED: 'Failed to load conversation.',
  CRISIS_MENU_ERROR: 'Unable to open crisis resources. Please dial 988 directly.',
} as const

export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Saved successfully!',
  UPDATE_SUCCESS: 'Updated successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
  EXPORT_SUCCESS: 'Data exported successfully!',
  ONBOARDING_COMPLETE: 'Onboarding completed successfully!',
} as const


// Gets a friendly error message by key.
export function getErrorMessage(key: keyof typeof ERROR_MESSAGES): string {
  return ERROR_MESSAGES[key] || ERROR_MESSAGES.GENERIC
}

