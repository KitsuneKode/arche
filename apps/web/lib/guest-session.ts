export function isRegisteredUser(
  session: { user?: { isAnonymous?: boolean | null } | null } | null | undefined,
): boolean {
  return Boolean(session?.user && !session.user.isAnonymous)
}
