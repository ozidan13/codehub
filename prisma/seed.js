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
      price: 400.00,
      isPaid: true
    },
    {
      name: 'Object-Oriented Programming (OOP)',
      description: 'Master object-oriented programming concepts',
      url: 'https://oop-pi.vercel.app/',
      price: 400.00,
      isPaid: true
    },
    {
      name: 'SOLID & Design Patterns',
      description: 'Learn SOLID principles and design patterns',
      url: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/',
      price: 400.00,
      isPaid: true
    },
    {
      name: 'JavaScript Interview Questions',
      description: 'Prepare for JavaScript technical interviews',
      url: 'https://javascriptinterview-kappa.vercel.app/',
      price: 400.00,
      isPaid: true
    },
    {
      name: 'JavaScript Tasks',
      description: 'Practice JavaScript programming tasks',
      url: 'https://ozidan13.github.io/js-tasks/',
      price: 400.00,
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
      password: hashedPassword,
      role: 'ADMIN',
      balance: 1000.00,
      isMentor: true,
      mentorBio: 'Experienced software developer and mentor with 10+ years in the industry.',
      mentorRate: 50.00
    }
  })
  console.log('✅ Created admin user: admin@codehub.com (password: admin123)')

  // Create sample student user
  console.log('👤 Creating sample student user...')
  const studentPassword = await bcrypt.hash('student123', 12)
  
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@codehub.com' },
    update: {},
    create: {
      email: 'student@codehub.com',
      name: 'Student User',
      password: studentPassword,
      role: 'STUDENT',
      balance: 500.00
    }
  })
  console.log('✅ Created student user: student@codehub.com (password: student123)')

  // Create sample transactions
  console.log('💰 Creating sample transactions...')
  await prisma.transaction.create({
    data: {
      userId: studentUser.id,
      type: 'TOP_UP',
      amount: 500.00,
      status: 'APPROVED',
      description: 'Initial wallet top-up',
      adminWalletNumber: '01026454497',
      senderWalletNumber: '01234567890'
    }
  })
  console.log('✅ Created sample transaction')

  // Create weekly available dates for mentorship (Friday to Thursday, 6 AM to 7 PM)
  console.log('📅 Creating weekly available dates...')
  
  // Generate weekly day-time slots (recurring pattern)
  const generateWeeklyDates = () => {
    const dates = []
    
    // Days from Friday to Thursday
    const dayNames = ['friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
    
    // Time slots from 6 AM to 7 PM (13 hours = 13 slots)
    const timeSlots = [
      '6:00 am', '7:00 am', '8:00 am', '9:00 am', '10:00 am', '11:00 am',
      '12:00 pm', '1:00 pm', '2:00 pm', '3:00 pm', '4:00 pm', '5:00 pm', '6:00 pm'
    ]
    
    // Create a base date for reference (we'll use a neutral date)
    const baseDate = new Date('2025-01-01T00:00:00Z')
    
    // Generate day-time combinations
    dayNames.forEach((dayName, dayIndex) => {
      timeSlots.forEach((timeSlot, timeIndex) => {
        // Create a unique date for each day-time combination
        // We'll use the day index and time index to create unique dates
        const slotDate = new Date(baseDate)
        slotDate.setDate(baseDate.getDate() + dayIndex)
        slotDate.setHours(timeIndex + 6, 0, 0, 0) // Start from 6 AM
        
        dates.push({
          date: slotDate,
          timeSlot: `${dayName} ${timeSlot}`,
          isBooked: false
        })
      })
    })
    
    return dates
  }
  
  const availableDates = generateWeeklyDates()
  console.log(`📊 Generated ${availableDates.length} day-time slots to process...`)
  
  // Process dates in batches for better performance
  const batchSize = 50
  let processed = 0
  
  for (let i = 0; i < availableDates.length; i += batchSize) {
    const batch = availableDates.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (dateData) => {
      await prisma.availableDate.upsert({
        where: {
          date_timeSlot: {
            date: dateData.date,
            timeSlot: dateData.timeSlot
          }
        },
        update: {},
        create: dateData
      })
    }))
    
    processed += batch.length
    console.log(`⏳ Processed ${processed}/${availableDates.length} dates...`)
  }
  
  console.log(`✅ Created ${availableDates.length} weekly day-time slots (Friday-Thursday, 6 AM-7 PM)`)

  // Create recorded session
  console.log('🎥 Creating recorded session...')
  await prisma.recordedSession.upsert({
    where: { id: 'recorded-session-1' },
    update: {
      title: 'Complete React Development Masterclass',
      description: 'A comprehensive recorded session covering React fundamentals, hooks, state management, and best practices. Perfect for beginners and intermediate developers.',
      videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      price: 150.00,
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
      amount: 100.00,
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
      amount: 500.00,
      status: 'PENDING',
      sessionDate: new Date('2025-01-15T10:00:00Z'),
      originalSessionDate: new Date('2025-01-15T10:00:00Z'),
      studentNotes: 'Need help with advanced JavaScript concepts',
      whatsappNumber: '+201234567890',
      dateChanged: false
    }
  })
  console.log('✅ Created sample mentorship bookings')

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