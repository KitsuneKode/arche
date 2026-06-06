import { userRepository } from './user.repository'

export const userService = {
  getDemoUser() {
    return { id: '1', name: 'Bilbo' }
  },

  listAll() {
    return userRepository.findAll()
  },

  findByEmail(email: string) {
    return userRepository.findByEmail(email)
  },
}
