import { postPolicy } from './post.policy'
import { postRepository } from './post.repository'

export const postService = {
  listPublished() {
    return postRepository.findPublishedMany()
  },

  getById(id: string) {
    return postRepository.findById(id)
  },

  getBySlug(slug: string) {
    return postRepository.findBySlug(slug)
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
