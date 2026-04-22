'use client'

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combines CSS class names.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

