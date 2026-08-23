import { prisma } from '../../db/index'

export const userRepository = {
  findAll() {
    return prisma.user.findMany()
  },

  findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email },
    })
  },
}
