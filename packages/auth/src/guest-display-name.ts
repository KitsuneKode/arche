export function guestDisplayName(userId: string): string {
  return `Guest-${userId.slice(-6)}`
}

export function resolveDisplayName(
  user: { id: string; name: string | null; isAnonymous?: boolean | null } | null,
): string | null {
  if (!user) return null
  if (user.isAnonymous) return guestDisplayName(user.id)
  return user.name
}
