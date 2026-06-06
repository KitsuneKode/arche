import { z } from 'zod'

const TRUE_VALUES = new Set(['true', '1', 'yes', 'on'])
const FALSE_VALUES = new Set(['false', '0', 'no', 'off'])

/**
 * Parse platform env strings into a real boolean.
 * Handles skipValidation paths (RENDER/VERCEL) where values stay as strings.
 */
export function envBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === null) {
    return defaultValue
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }

  const normalized = String(value).trim().toLowerCase()
  if (normalized === '') {
    return false
  }
  if (TRUE_VALUES.has(normalized)) {
    return true
  }
  if (FALSE_VALUES.has(normalized)) {
    return false
  }

  return defaultValue
}

export function envBooleanSchema(defaultValue: boolean) {
  return z.preprocess((val) => envBoolean(val, defaultValue), z.boolean())
}
