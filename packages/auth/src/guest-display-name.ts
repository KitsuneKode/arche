export function guestDisplayName(userId: string): string {
  const suffix = userId.slice(-8)
  return `Guest · ${suffix}`
}

export function resolveDisplayName(
  user: { id: string; name: string | null; isAnonymous?: boolean | null } | null,
): string | null {
  if (!user) return null
  if (user.isAnonymous) return guestDisplayName(user.id)
  if (!user.name?.trim()) return guestDisplayName(user.id)
  return user.name
}
