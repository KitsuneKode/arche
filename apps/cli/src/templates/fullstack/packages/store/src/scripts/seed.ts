import { prisma } from '../index'

async function main() {
  console.log('No default seed data configured.')
  console.log('Add your own records to packages/store/src/scripts/seed.ts when ready.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
