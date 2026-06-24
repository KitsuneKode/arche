import { userRepository } from './user.repository'

export const userService = {
  getDemoUser() {
    return { id: '1', name: 'Bilbo' }
  },

  findByEmail(email: string) {
    return userRepository.findByEmail(email)
  },
}
