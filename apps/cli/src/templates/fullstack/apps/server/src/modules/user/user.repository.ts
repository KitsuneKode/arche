import { prisma } from '../../db/index.js'

export const userRepository = {
  findAll() {
    return prisma.user.findMany()
  },

  findByEmail(email: string) {
    return prisma.user.findMany({
      where: { email },
    })
  },
}
