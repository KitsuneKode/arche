export function isLatticeSchemaMissing(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2021'
  ) {
    return true
  }

  const message = error instanceof Error ? error.message : String(error)
  return message.includes('lattice_') && message.includes('does not exist')
}
