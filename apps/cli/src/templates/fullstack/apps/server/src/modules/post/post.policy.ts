import { ForbiddenError } from '../../common/errors'

type OwnablePost = { authorId: string } | null

export const postPolicy = {
  assertOwner(post: OwnablePost, userId: string) {
    if (!post || post.authorId !== userId) {
      throw new ForbiddenError('Unauthorized')
    }
  },
}
