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
  
  // Define platform-specific tasks with links
  const platformTasks = {
    'Algorithms & Data Structures': [
      {
        title: 'Array Algorithms',
        description: 'Learn and implement basic array algorithms',
        link: 'https://ozidan13.github.io/algorithms/#arrays',
        order: 1
      },
      {
        title: 'Sorting Algorithms',
        description: 'Understand and implement various sorting algorithms',
        link: 'https://ozidan13.github.io/algorithms/#sorting',
        order: 2
      },
      {
        title: 'Binary Search Trees',
        description: 'Master binary search tree operations',
        link: 'https://ozidan13.github.io/algorithms/#trees',
        order: 3
      }
    ],
    'Object-Oriented Programming (OOP)': [
      {
        title: 'Classes and Objects',
        description: 'Learn the fundamentals of classes and objects',
        link: 'https://oop-pi.vercel.app/#classes',
        order: 1
      },
      {
        title: 'Inheritance and Polymorphism',
        description: 'Master inheritance and polymorphism concepts',
        link: 'https://oop-pi.vercel.app/#inheritance',
        order: 2
      },
      {
        title: 'Encapsulation and Abstraction',
        description: 'Understand encapsulation and abstraction principles',
        link: 'https://oop-pi.vercel.app/#encapsulation',
        order: 3
      }
    ],
    'SOLID & Design Patterns': [
      {
        title: 'Single Responsibility Principle',
        description: 'Learn and apply the Single Responsibility Principle',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/#srp',
        order: 1
      },
      {
        title: 'Open/Closed Principle',
        description: 'Understand the Open/Closed Principle',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/#ocp',
        order: 2
      },
      {
        title: 'Design Patterns',
        description: 'Implement common design patterns',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/#patterns',
        order: 3
      }
    ],
    'JavaScript Interview Questions': [
      {
        title: 'JavaScript Fundamentals',
        description: 'Master JavaScript fundamental concepts for interviews',
        link: 'https://javascriptinterview-kappa.vercel.app/#fundamentals',
        order: 1
      },
      {
        title: 'Async JavaScript',
        description: 'Understand promises, async/await, and callbacks',
        link: 'https://javascriptinterview-kappa.vercel.app/#async',
        order: 2
      },
      {
        title: 'Advanced JavaScript',
        description: 'Learn advanced JavaScript concepts and patterns',
        link: 'https://javascriptinterview-kappa.vercel.app/#advanced',
        order: 3
      }
    ],
    'JavaScript Tasks': [
      {
        title: 'Basic JavaScript Exercises',
        description: 'Complete basic JavaScript programming exercises',
        link: 'https://ozidan13.github.io/js-tasks/#basic',
        order: 1
      },
      {
        title: 'DOM Manipulation Tasks',
        description: 'Practice DOM manipulation and event handling',
        link: 'https://ozidan13.github.io/js-tasks/#dom',
        order: 2
      },
      {
        title: 'Advanced JavaScript Challenges',
        description: 'Solve advanced JavaScript programming challenges',
        link: 'https://ozidan13.github.io/js-tasks/#advanced',
        order: 3
      }
    ]
  }
  
  for (const platform of createdPlatforms) {
    const tasks = platformTasks[platform.name] || []
    
    for (const task of tasks) {
      await prisma.task.upsert({
        where: { 
          id: `${platform.id}-task-${task.order}`
        },
        update: {},
        create: {
          ...task,
          platformId: platform.id,
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