import { prisma } from '../../db/index.js'

export const postRepository = {
  findPublishedMany() {
    return prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    })
  },

  findById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: { author: true },
    })
  },

  findBySlug(slug: string) {
    return prisma.post.findUnique({
      where: { slug },
      include: { author: true },
    })
  },

  create(data: {
    title: string
    content: string
    slug: string
    published?: boolean
    authorId: string
  }) {
    return prisma.post.create({ data })
  },

  update(id: string, data: { title?: string; content?: string; published?: boolean }) {
    return prisma.post.update({ where: { id }, data })
  },

  delete(id: string) {
    return prisma.post.delete({ where: { id } })
  },
}
