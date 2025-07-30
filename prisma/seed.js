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
      url: 'https://ozidan13.github.io/algorithms/',
      price: 20000.00,
      isPaid: true
    },
    {
      name: 'Object-Oriented Programming (OOP)',
      description: 'Master object-oriented programming concepts',
      url: 'https://oop-pi.vercel.app/',
      price: 20000.00,
      isPaid: true
    },
    {
      name: 'SOLID & Design Patterns',
      description: 'Learn SOLID principles and design patterns',
      url: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/',
      price: 20000.00,
        isPaid: true
      },
      {
        name: 'JavaScript Interview Questions',
        description: 'Prepare for JavaScript technical interviews',
        url: 'https://javascriptinterview-kappa.vercel.app/',
        price: 20000.00,
        isPaid: true
      },
      {
        name: 'JavaScript Tasks',
        description: 'Practice JavaScript programming tasks',
        url: 'https://ozidan13.github.io/js-tasks/',
        price: 20000.00,
      isPaid: true
    }
  ]

  console.log('📚 Creating platforms...')
  for (const platform of platforms) {
    await prisma.platform.upsert({
      where: { name: platform.name },
      update: {
        description: platform.description,
        url: platform.url,
        price: platform.price,
        isPaid: platform.isPaid
      },
      create: platform
    })
    console.log(`✅ Created/Updated platform: ${platform.name} - $${platform.price}`)
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
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@codehub.com' },
    update: {},
    create: {
      email: 'admin@codehub.com',
      name: 'Admin User',
      phoneNumber: '01026454497',
      password: hashedPassword,
      role: 'ADMIN',
      balance: 50000.00,
      isMentor: true,
      mentorBio: 'Experienced software developer and mentor with 10+ years in the industry.',
      mentorRate: 2500.00
    }
  })
  console.log('✅ Created admin user: admin@codehub.com (password: admin123)')

  // Create sample student user
  console.log('👤 Creating sample student user...')
  const studentPassword = await bcrypt.hash('student123', 12)
  
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@codehub.com' },
    update: {
      balance: 25000.00  // Reset balance to ensure sufficient funds
    },
    create: {
      email: 'student@codehub.com',
      name: 'Student User',
      phoneNumber: '01234567890',
      password: studentPassword,
      role: 'STUDENT',
      balance: 25000.00
    }
  })
  console.log('✅ Created student user: student@codehub.com (password: student123)')

  // Create sample transactions
  console.log('💰 Creating sample transactions...')
  await prisma.transaction.create({
    data: {
      userId: studentUser.id,
      type: 'TOP_UP',
      amount: 25000.00,
      status: 'APPROVED',
      description: 'Initial wallet top-up',
      adminWalletNumber: '01026454497',
      senderWalletNumber: '01234567890'
    }
  })
  console.log('✅ Created sample transaction')


  // Create recorded session
  console.log('🎥 Creating recorded session...')
  await prisma.recordedSession.upsert({
    where: { id: 'recorded-session-1' },
    update: {
      title: 'Complete React Development Masterclass',
      description: 'A comprehensive recorded session covering React fundamentals, hooks, state management, and best practices. Perfect for beginners and intermediate developers.',
      videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      price: 7500.00,
      isActive: true
    },
    create: {
      id: 'recorded-session-1',
      title: 'Complete React Development Masterclass',
      description: 'A comprehensive recorded session covering React fundamentals, hooks, state management, and best practices. Perfect for beginners and intermediate developers.',
      videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      price: 150.00,
      isActive: true
    }
  })
  console.log('✅ Created recorded session')

  // Create sample mentorship bookings
  console.log('🎓 Creating sample mentorship bookings...')
  
  // Recorded session booking
  await prisma.mentorshipBooking.create({
    data: {
      studentId: studentUser.id,
      mentorId: adminUser.id,
      sessionType: 'RECORDED',
      duration: 60,
      amount: 5000.00,
      status: 'CONFIRMED',
      sessionDate: new Date(),
      studentNotes: 'Looking for help with React basics',
      videoLink: 'https://example.com/recorded-session-1',
      dateChanged: false
    }
  })

  // Face-to-face session booking (pending)
  await prisma.mentorshipBooking.create({
    data: {
      studentId: studentUser.id,
      mentorId: adminUser.id,
      sessionType: 'FACE_TO_FACE',
      duration: 60,
      amount: 25000.00,
      status: 'PENDING',
      sessionDate: new Date('2025-01-15T10:00:00Z'),
      originalSessionDate: new Date('2025-01-15T10:00:00Z'),
      studentNotes: 'Need help with advanced JavaScript concepts',
      whatsappNumber: '+201234567890',
      dateChanged: false
    }
  })
  console.log('✅ Created sample mentorship bookings')

  // Create available dates for mentorship booking
  console.log('📅 Creating available dates...')
  
  const today = new Date()
  const availableDates = []
  
  // Create available dates for the next 30 days
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    // Skip weekends (Friday = 5, Saturday = 6)
    if (date.getDay() === 5 || date.getDay() === 6) continue
    
    // Create time slots for each day
    const timeSlots = [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' }
    ]
    
    for (const slot of timeSlots) {
      availableDates.push({
        date: date,
        startTime: slot.start,
        endTime: slot.end,
        timeSlot: `${slot.start} - ${slot.end}`,
        isBooked: false,
        isRecurring: false
      })
    }
  }
  
  // Create all available dates
  for (const dateData of availableDates) {
    try {
      await prisma.availableDate.create({
        data: dateData
      })
    } catch (error) {
      // Skip if date already exists (unique constraint)
      if (error.code !== 'P2002') {
        console.error('Error creating available date:', error)
      }
    }
  }
  
  console.log(`✅ Created ${availableDates.length} available date slots`)

  // Note: Students will enroll themselves through the application

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