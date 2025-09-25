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
      courseLink: 'https://www.youtube.com/playlist?list=PLDoPjvoNmBAx3kiplQR_oeDqLDBUDYwVv',
      price: 400.00,
      isPaid: true
    },
    {
      name: 'Object-Oriented Programming (OOP)',
      description: 'Master object-oriented programming concepts',
      url: 'https://oop-pi.vercel.app/',
      courseLink: 'https://www.youtube.com/playlist?list=PLDoPjvoNmBAzDuDhkL-mqob6PaN_uFqMx',
      price: 400.00,
      isPaid: true
    },
    {
      name: 'SOLID & Design Patterns',
      description: 'Learn SOLID principles and design patterns',
      url: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/',
      courseLink: 'https://www.youtube.com/playlist?list=PLDoPjvoNmBAzJeOr2N5ZiBEWVeKw7RvEv',
      price: 400.00,
      isPaid: true
    },
    {
      name: 'JavaScript Interview Questions',
      description: 'Prepare for JavaScript technical interviews',
      url: 'https://javascriptinterview-kappa.vercel.app/',
      courseLink: 'https://www.youtube.com/playlist?list=PLDoPjvoNmBAx9Db8HevkRkBz8CB7Ub7ER',
      price: 400.00,
      isPaid: true
    },
    {
      name: 'JavaScript Tasks',
      description: 'Practice JavaScript programming tasks',
      url: 'https://ozidan13.github.io/js-tasks/',
      courseLink: 'https://www.youtube.com/playlist?list=PLDoPjvoNmBAx3kiplQR_oeDqLDBUDYwVv',
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
        courseLink: platform.courseLink,
        price: platform.price,
        isPaid: platform.isPaid
      },
      create: platform
    })
    console.log(`✅ Created/Updated platform: ${platform.name} - ${platform.price} جنية`)
  }

  // Create sample tasks for each platform
  console.log('📝 Creating sample tasks...')
  const createdPlatforms = await prisma.platform.findMany()
  
  // Define platform-specific tasks with links
  const platformTasks = {
    'Algorithms & Data Structures': [
      {
        title: 'Binary Search Algorithm',
        description: 'Learn and implement binary search algorithm with interactive visualization',
        link: 'https://ozidan13.github.io/algorithms/Week1/binary_search.html',
        order: 1
      },
      {
        title: 'Selection Sort Algorithm',
        description: 'Understand and implement selection sort with step-by-step visualization',
        link: 'https://ozidan13.github.io/algorithms/Week1/selection_sort.html',
        order: 2
      },
      {
        title: 'Recursion Examples',
        description: 'Master recursion concepts through interactive examples',
        link: 'https://ozidan13.github.io/algorithms/Week1/recursion_examples.html',
        order: 3
      },
      {
        title: 'Big O Notation Visualization',
        description: 'Visualize and understand time complexity analysis',
        link: 'https://ozidan13.github.io/algorithms/Week1/big_o_visualization.html',
        order: 4
      },
      {
        title: 'Array Operations Visualization',
        description: 'Learn array operations with interactive demonstrations',
        link: 'https://ozidan13.github.io/algorithms/Week2/array_operations.html',
        order: 5
      },
      {
        title: 'Linked List Visualization',
        description: 'Understand linked list data structure and operations',
        link: 'https://ozidan13.github.io/algorithms/Week2/linked_list.html',
        order: 6
      },
      {
        title: 'Merge Sort Visualization',
        description: 'Learn divide and conquer with merge sort algorithm',
        link: 'https://ozidan13.github.io/algorithms/Week2/recursive_divide_conquer.html',
        order: 7
      },
      {
        title: 'Memory Visualization',
        description: 'Compare arrays vs linked lists memory management',
        link: 'https://ozidan13.github.io/algorithms/Week2/memory_visualization.html',
        order: 8
      },
      {
        title: 'Quicksort Visualization',
        description: 'Master the quicksort algorithm with interactive demo',
        link: 'https://ozidan13.github.io/algorithms/Week3/quicksort_visualization.html',
        order: 9
      },
      {
        title: 'Hash Table Visualization',
        description: 'Understand hash tables and collision resolution',
        link: 'https://ozidan13.github.io/algorithms/Week3/hash_table.html',
        order: 10
      },
      {
        title: 'Graph Representation',
        description: 'Learn different ways to represent graphs',
        link: 'https://ozidan13.github.io/algorithms/Week3/graph_representation.html',
        order: 11
      },
      {
        title: 'Graph Traversal',
        description: 'Master BFS and DFS graph traversal algorithms',
        link: 'https://ozidan13.github.io/algorithms/Week3/graph_traversal.html',
        order: 12
      },
      {
        title: 'Greedy Algorithms',
        description: 'Learn greedy algorithm design technique',
        link: 'https://ozidan13.github.io/algorithms/Week4/greedy_algorithms.html',
        order: 13
      },
      {
        title: 'Dynamic Programming',
        description: 'Master dynamic programming optimization technique',
        link: 'https://ozidan13.github.io/algorithms/Week4/dynamic_programming.html',
        order: 14
      },
      {
        title: 'Knapsack Problem',
        description: 'Solve the classic knapsack problem',
        link: 'https://ozidan13.github.io/algorithms/Week4/knapsack_problem.html',
        order: 15
      },
      {
        title: 'K-Nearest Neighbors',
        description: 'Implement KNN classification algorithm',
        link: 'https://ozidan13.github.io/algorithms/Week4/knn_classifier.html',
        order: 16
      }
    ],
    'Object-Oriented Programming (OOP)': [
      {
        title: 'Introduction to OOP',
        description: 'Learn the fundamentals of object-oriented programming',
        link: 'https://oop-pi.vercel.app/module1_classes_objects',
        order: 1
      },
      {
        title: 'Encapsulation',
        description: 'Master data hiding and encapsulation principles',
        link: 'https://oop-pi.vercel.app/module2_encapsulation',
        order: 2
      },
      {
        title: 'Inheritance',
        description: 'Understand inheritance and code reuse',
        link: 'https://oop-pi.vercel.app/module3_inheritance',
        order: 3
      },
      {
        title: 'Polymorphism',
        description: 'Learn different forms of polymorphism',
        link: 'https://oop-pi.vercel.app/module4_polymorphism',
        order: 4
      },
      {
        title: 'Abstraction',
        description: 'Master abstract classes and interfaces',
        link: 'https://oop-pi.vercel.app/module5_abstraction',
        order: 5
      },
      {
        title: 'TypeScript Classes',
        description: 'Learn advanced class features in TypeScript',
        link: 'https://www.typescriptlang.org/docs/handbook/2/classes.html',
        order: 6
      }
    ],
    'SOLID & Design Patterns': [
      {
        title: 'Single Responsibility Principle',
        description: 'Learn and apply the Single Responsibility Principle',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/solid/01_single_responsibility/index.html',
        order: 1
      },
      {
        title: 'Open-Closed Principle',
        description: 'Understand and implement the Open-Closed Principle',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/solid/02_open_closed/index.html',
        order: 2
      },
      {
        title: 'Liskov Substitution Principle',
        description: 'Master the Liskov Substitution Principle',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/solid/03_liskov_substitution/index.html',
        order: 3
      },
      {
        title: 'Interface Segregation Principle',
        description: 'Apply the Interface Segregation Principle',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/solid/04_interface_segregation/index.html',
        order: 4
      },
      {
        title: 'Dependency Inversion Principle',
        description: 'Implement the Dependency Inversion Principle',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/solid/05_dependency_inversion/index.html',
        order: 5
      },
      {
        title: 'Singleton Pattern',
        description: 'Learn the Singleton creational pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/creational/singleton/index.html',
        order: 6
      },
      {
        title: 'Factory Method Pattern',
        description: 'Implement the Factory Method pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/creational/factory_method/index.html',
        order: 7
      },
      {
        title: 'Abstract Factory Pattern',
        description: 'Master the Abstract Factory pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/creational/abstract_factory/index.html',
        order: 8
      },
      {
        title: 'Builder Pattern',
        description: 'Learn the Builder creational pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/creational/builder/index.html',
        order: 9
      },
      {
        title: 'Prototype Pattern',
        description: 'Implement the Prototype pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/creational/prototype/index.html',
        order: 10
      },
      {
        title: 'Adapter Pattern',
        description: 'Learn the Adapter structural pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/structural/adapter/index.html',
        order: 11
      },
      {
        title: 'Bridge Pattern',
        description: 'Master the Bridge structural pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/structural/bridge/index.html',
        order: 12
      },
      {
        title: 'Composite Pattern',
        description: 'Implement the Composite pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/structural/composite/index.html',
        order: 13
      },
      {
        title: 'Decorator Pattern',
        description: 'Learn the Decorator structural pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/structural/decorator/index.html',
        order: 14
      },
      {
        title: 'Facade Pattern',
        description: 'Master the Facade structural pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/structural/facade/index.html',
        order: 15
      },
      {
        title: 'Flyweight Pattern',
        description: 'Implement the Flyweight pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/structural/flyweight/index.html',
        order: 16
      },
      {
        title: 'Proxy Pattern',
        description: 'Learn the Proxy structural pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/structural/proxy/index.html',
        order: 17
      },
      {
        title: 'Strategy Pattern',
        description: 'Master the Strategy behavioral pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/strategy/index.html',
        order: 18
      },
      {
        title: 'Observer Pattern',
        description: 'Implement the Observer pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/observer/index.html',
        order: 19
      },
      {
        title: 'Command Pattern',
        description: 'Learn the Command behavioral pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/command/index.html',
        order: 20
      },
      {
        title: 'Template Method Pattern',
        description: 'Master the Template Method pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/template_method/index.html',
        order: 21
      },
      {
        title: 'Iterator Pattern',
        description: 'Implement the Iterator pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/iterator/index.html',
        order: 22
      },
      {
        title: 'State Pattern',
        description: 'Learn the State behavioral pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/state/index.html',
        order: 23
      },
      {
        title: 'Chain of Responsibility',
        description: 'Master the Chain of Responsibility pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/chain_of_responsibility/index.html',
        order: 24
      },
      {
        title: 'Mediator Pattern',
        description: 'Implement the Mediator pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/mediator/index.html',
        order: 25
      },
      {
        title: 'Memento Pattern',
        description: 'Learn the Memento behavioral pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/memento/index.html',
        order: 26
      },
      {
        title: 'Visitor Pattern',
        description: 'Master the Visitor behavioral pattern',
        link: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/design_patterns/behavioral/visitor/index.html',
        order: 27
      }
    ],
    'JavaScript Tasks': [
      {
        title: 'Task 1',
        description: 'Complete JavaScript programming task 1',
        link: 'https://ozidan13.github.io/js-tasks/#task1',
        order: 1
      },
      {
        title: 'Task 2',
        description: 'Complete JavaScript programming task 2',
        link: 'https://ozidan13.github.io/js-tasks/#task2',
        order: 2
      },
      {
        title: 'Task 3',
        description: 'Complete JavaScript programming task 3',
        link: 'https://ozidan13.github.io/js-tasks/#task3',
        order: 3
      },
      {
        title: 'Task 4',
        description: 'Complete JavaScript programming task 4',
        link: 'https://ozidan13.github.io/js-tasks/#task4',
        order: 4
      },
      {
        title: 'Task 5',
        description: 'Complete JavaScript programming task 5',
        link: 'https://ozidan13.github.io/js-tasks/#task5',
        order: 5
      },
      {
        title: 'Task 6',
        description: 'Complete JavaScript programming task 6',
        link: 'https://ozidan13.github.io/js-tasks/#task6',
        order: 6
      },
      {
        title: 'Task 7',
        description: 'Complete JavaScript programming task 7',
        link: 'https://ozidan13.github.io/js-tasks/#task7',
        order: 7
      },
      {
        title: 'Task 8',
        description: 'Complete JavaScript programming task 8',
        link: 'https://ozidan13.github.io/js-tasks/#task8',
        order: 8
      },
      {
        title: 'Task 9',
        description: 'Complete JavaScript programming task 9',
        link: 'https://ozidan13.github.io/js-tasks/#task9',
        order: 9
      },
      {
        title: 'Task 10',
        description: 'Complete JavaScript programming task 10',
        link: 'https://ozidan13.github.io/js-tasks/#task10',
        order: 10
      },
      {
        title: 'Task 11',
        description: 'Complete JavaScript programming task 11',
        link: 'https://ozidan13.github.io/js-tasks/#task11',
        order: 11
      },
      {
        title: 'Task 12',
        description: 'Complete JavaScript programming task 12',
        link: 'https://ozidan13.github.io/js-tasks/#task12',
        order: 12
      },
      {
        title: 'Task 13',
        description: 'Complete JavaScript programming task 13',
        link: 'https://ozidan13.github.io/js-tasks/#task13',
        order: 13
      },
      {
        title: 'Task 14',
        description: 'Complete JavaScript programming task 14',
        link: 'https://ozidan13.github.io/js-tasks/#task14',
        order: 14
      },
      {
        title: 'Task 15',
        description: 'Complete JavaScript programming task 15',
        link: 'https://ozidan13.github.io/js-tasks/#task15',
        order: 15
      },
      {
        title: 'Task 16',
        description: 'Complete JavaScript programming task 16',
        link: 'https://ozidan13.github.io/js-tasks/#task16',
        order: 16
      },
      {
        title: 'Task 17',
        description: 'Complete JavaScript programming task 17',
        link: 'https://ozidan13.github.io/js-tasks/#task17',
        order: 17
      },
      {
        title: 'Task 18',
        description: 'Complete JavaScript programming task 18',
        link: 'https://ozidan13.github.io/js-tasks/#task18',
        order: 18
      },
      {
        title: 'Task 19',
        description: 'Complete JavaScript programming task 19',
        link: 'https://ozidan13.github.io/js-tasks/#task19',
        order: 19
      },
      {
        title: 'Task 20',
        description: 'Complete JavaScript programming task 20',
        link: 'https://ozidan13.github.io/js-tasks/#task20',
        order: 20
      },
      {
        title: 'Task 21',
        description: 'Complete JavaScript programming task 21',
        link: 'https://ozidan13.github.io/js-tasks/#task21',
        order: 21
      },
      {
        title: 'Task 22',
        description: 'Complete JavaScript programming task 22',
        link: 'https://ozidan13.github.io/js-tasks/#task22',
        order: 22
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
      phoneNumber: '01234567890',
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