

import { z } from 'zod'


// Cleans text input.
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}


export const whyDocumentSchema = z.string()
  .min(10, 'Why document must be at least 10 characters')
  .max(2000, 'Why document must be less than 2000 characters')
  .refine(
    (val) => !/<script|javascript:|onerror=|onclick=|onload=/i.test(val),
    'Invalid characters detected. Please remove any script tags or event handlers.'
  )

// Validates the why document text.
export function validateWhyDocument(input: string): { valid: boolean; error?: string; sanitized?: string } {
  try {
    const sanitized = sanitizeString(input)
    whyDocumentSchema.parse(sanitized)
    return { valid: true, sanitized }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { valid: false, error: 'Validation failed' }
  }
}


export const replacementActivitySchema = z.string()
  .min(2, 'Activity name must be at least 2 characters')
  .max(100, 'Activity name must be less than 100 characters')
  .refine(
    (val) => !/<script|javascript:|onerror=/i.test(val),
    'Invalid characters detected'
  )

// Validates a replacement activity.
export function validateReplacementActivity(input: string): { valid: boolean; error?: string; sanitized?: string } {
  try {
    const sanitized = sanitizeString(input)
    replacementActivitySchema.parse(sanitized)
    return { valid: true, sanitized }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { valid: false, error: 'Validation failed' }
  }
}


export const precursorEventSchema = z.string()
  .max(500, 'Precursor event must be less than 500 characters')
  .refine(
    (val) => !/<script|javascript:|onerror=/i.test(val),
    'Invalid characters detected'
  )
  .optional()

// Validates the precursor event text.
export function validatePrecursorEvent(input: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: true, sanitized: '' }
  }
  
  try {
    const sanitized = sanitizeString(input)
    precursorEventSchema.parse(sanitized)
    return { valid: true, sanitized }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { valid: false, error: 'Validation failed' }
  }
}

