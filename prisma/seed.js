const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create platforms
  const platforms = [
    {
      name: 'Algorithms & Data Structures',
      description: 'Learn fundamental algorithms and data structures',
      url: 'https://ozidan13.github.io/algorithms/'
    },
    {
      name: 'Object-Oriented Programming (OOP)',
      description: 'Master object-oriented programming concepts',
      url: 'https://oop-pi.vercel.app/'
    },
    {
      name: 'SOLID & Design Patterns',
      description: 'Learn SOLID principles and design patterns',
      url: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/'
    },
    {
      name: 'JavaScript Interview Questions',
      description: 'Prepare for JavaScript technical interviews',
      url: 'https://javascriptinterview-kappa.vercel.app/'
    },
    {
      name: 'JavaScript Tasks',
      description: 'Practice JavaScript programming tasks',
      url: 'https://ozidan13.github.io/js-tasks/'
    }
  ]

  console.log('📚 Creating platforms...')
  for (const platform of platforms) {
    await prisma.platform.upsert({
      where: { name: platform.name },
      update: {},
      create: platform
    })
    console.log(`✅ Created platform: ${platform.name}`)
  }

  // Create sample tasks for each platform
  console.log('📝 Creating sample tasks...')
  const createdPlatforms = await prisma.platform.findMany()
  
  for (const platform of createdPlatforms) {
    const sampleTasks = [
      {
        title: `${platform.name} - Task 1`,
        description: `Complete the first task in ${platform.name}`,
        platformId: platform.id,
        order: 1
      },
      {
        title: `${platform.name} - Task 2`,
        description: `Complete the second task in ${platform.name}`,
        platformId: platform.id,
        order: 2
      },
      {
        title: `${platform.name} - Task 3`,
        description: `Complete the third task in ${platform.name}`,
        platformId: platform.id,
        order: 3
      }
    ]

    for (const task of sampleTasks) {
      await prisma.task.upsert({
        where: { 
          id: `${platform.id}-task-${task.order}`
        },
        update: {},
        create: {
          ...task,
          id: `${platform.id}-task-${task.order}`
        }
      })
    }
    console.log(`✅ Created tasks for: ${platform.name}`)
  }

  // Create admin user
  console.log('👤 Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  await prisma.user.upsert({
    where: { email: 'admin@codehub.com' },
    update: {},
    create: {
      email: 'admin@codehub.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })
  console.log('✅ Created admin user: admin@codehub.com (password: admin123)')

  // Create sample student user
  console.log('👤 Creating sample student user...')
  const studentPassword = await bcrypt.hash('student123', 12)
  
  await prisma.user.upsert({
    where: { email: 'student@codehub.com' },
    update: {},
    create: {
      email: 'student@codehub.com',
      name: 'Student User',
      password: studentPassword,
      role: 'STUDENT'
    }
  })
  console.log('✅ Created student user: student@codehub.com (password: student123)')

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })