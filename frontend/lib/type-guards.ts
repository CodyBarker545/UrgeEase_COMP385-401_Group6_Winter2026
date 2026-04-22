


// Checks whether the app is running as an iOS PWA.
export function isIOSPWA(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  return (
    'navigator' in window &&
    'standalone' in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}


// Checks whether a value is a valid date string.
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }
  
  const date = new Date(value)
  return !isNaN(date.getTime())
}


// Checks whether a value is a non-empty string.
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}


// Checks whether a value is a valid number.
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}


// Checks whether a value is a valid integer.
export function isValidInteger(value: unknown): value is number {
  return isValidNumber(value) && Number.isInteger(value)
}


// Checks whether a value looks like an email.
export function isValidEmailFormat(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

