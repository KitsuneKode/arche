type PublicUserShape = {
  id: string
  name: string | null
  image: string | null
}

type UserWithOptionalFields = {
  id: string
  name: string | null
  image: string | null
  email?: string | null
  emailVerified?: boolean | null
}

export function toPublicUser(user: UserWithOptionalFields | null): PublicUserShape | null {
  if (!user) return null
  const trimmed = user.name?.trim()
  return { id: user.id, name: trimmed || 'User', image: user.image }
}
