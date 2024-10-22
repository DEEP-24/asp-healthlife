import { PrismaClient } from '@prisma/client'

import { createHash } from '~/utils/encryption'
import { UserRole } from '~/utils/enums'

const db = new PrismaClient()

async function cleanup() {
  console.time('🧹 Cleaned up the database...')

  await db.user.deleteMany()

  console.timeEnd('🧹 Cleaned up the database...')
}

async function createUsers() {
  console.time('👤 Created users...')

  await db.user.create({
    data: {
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'admin@app.com',
      city: 'San Francisco',
      street: '123 Main Street',
      phoneNo: '(123) 456-7890',
      state: 'CA',
      zip: '94102',
      dob: new Date('1985-07-12'),
      password: await createHash('password'),
      role: UserRole.ADMIN,
    },
  })

  await db.user.create({
    data: {
      firstName: 'Sophia',
      lastName: 'Anderson',
      street: '123 Main Street',
      phoneNo: '(123) 456-7890',
      city: 'Houston',
      state: 'TX',
      zip: '77002',
      dob: new Date('1993-11-18'),
      email: 'user@app.com',
      password: await createHash('password'),
      role: UserRole.USER,
      height: '170',
      weight: '60',
    },
  })

  await db.user.create({
    data: {
      firstName: 'Dr. John',
      lastName: 'Doe',
      street: '456 Medical Avenue',
      phoneNo: '(987) 654-3210',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      dob: new Date('1980-03-15'),
      email: 'dr.john@app.com',
      password: await createHash('password'),
      role: UserRole.HEALTHCARE_PROFESSIONAL,
    },
  })

  console.timeEnd('👤 Created users...')
}

async function seed() {
  console.log('🌱 Seeding...\n')

  console.time('🌱 Database has been seeded')
  await cleanup()
  await createUsers()

  console.timeEnd('🌱 Database has been seeded')
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
