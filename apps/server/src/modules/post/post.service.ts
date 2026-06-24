import { toPublicUser } from '../common/public-dto.js'
import { postPolicy } from './post.policy'
import { postRepository } from './post.repository'

type PostWithAuthor = NonNullable<Awaited<ReturnType<typeof postRepository.findById>>>

function toPublicAuthor(author: PostWithAuthor['author']) {
  return toPublicUser(author)
}

function toPublicPost(post: PostWithAuthor | null) {
  if (!post || !post.published) return null
  return {
    ...post,
    author: toPublicAuthor(post.author),
  }
}

export const postService = {
  listPublished() {
    return postRepository.findPublishedMany().then((posts) =>
      posts.map((post) => ({
        ...post,
        author: toPublicAuthor(post.author),
      })),
    )
  },

  async getById(id: string) {
    const post = await postRepository.findById(id)
    return toPublicPost(post)
  },

  async getBySlug(slug: string) {
    const post = await postRepository.findBySlug(slug)
    return toPublicPost(post)
  },

  async create(
    userId: string,
    input: { title: string; content: string; slug: string; published?: boolean },
  ) {
    return postRepository.create({ ...input, authorId: userId })
  },

  async update(
    userId: string,
    input: { id: string; title?: string; content?: string; published?: boolean },
  ) {
    const post = await postRepository.findById(input.id)
    postPolicy.assertOwner(post, userId)
    const { id, ...data } = input
    return postRepository.update(id, data)
  },

  async delete(userId: string, id: string) {
    const post = await postRepository.findById(id)
    postPolicy.assertOwner(post, userId)
    return postRepository.delete(id)
  },
}
