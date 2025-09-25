const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function enrollExistingUsersInJavaScriptTasks() {
  try {
    console.log('🚀 Starting enrollment process for existing users...')

    // First, ensure the JavaScript Tasks platform exists
    let jsPlatform = await prisma.platform.findFirst({
      where: {
        OR: [
          { name: 'مهام JavaScript العملية' },
          { name: 'JavaScript Tasks' },
          { url: 'https://ozidan13.github.io/js-tasks/' }
        ]
      }
    })

    // If platform doesn't exist, create it
    if (!jsPlatform) {
      console.log('📝 Creating JavaScript Tasks platform...')
      jsPlatform = await prisma.platform.create({
        data: {
          name: 'مهام JavaScript العملية',
          description: 'برمجة JavaScript العملية والتطبيقية - مهام تفاعلية لتطوير مهارات البرمجة',
          url: 'https://ozidan13.github.io/js-tasks/',
          price: 0.00, // Free platform
          isPaid: false
        }
      })
      console.log('✅ JavaScript Tasks platform created successfully!')
    } else {
      console.log('✅ JavaScript Tasks platform found:', jsPlatform.name)
    }

    // Get all existing users (students only)
    const existingUsers = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    console.log(`👥 Found ${existingUsers.length} existing students`)

    if (existingUsers.length === 0) {
      console.log('ℹ️  No existing students found to enroll')
      return
    }

    // Check which users are already enrolled
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        platformId: jsPlatform.id,
        userId: {
          in: existingUsers.map(user => user.id)
        }
      },
      select: {
        userId: true
      }
    })

    const enrolledUserIds = new Set(existingEnrollments.map(e => e.userId))
    const usersToEnroll = existingUsers.filter(user => !enrolledUserIds.has(user.id))

    console.log(`📊 Users already enrolled: ${enrolledUserIds.size}`)
    console.log(`📊 Users to enroll: ${usersToEnroll.length}`)

    if (usersToEnroll.length === 0) {
      console.log('✅ All existing users are already enrolled in JavaScript Tasks!')
      return
    }

    // Enroll users in batches
    const batchSize = 10
    let enrolledCount = 0
    let failedCount = 0
    const failedUsers = []

    for (let i = 0; i < usersToEnroll.length; i += batchSize) {
      const batch = usersToEnroll.slice(i, i + batchSize)
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usersToEnroll.length / batchSize)}...`)

      for (const user of batch) {
        try {
          // Set expiration to 365 days (1 year) for existing users as a bonus
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 365)

          await prisma.enrollment.create({
            data: {
              userId: user.id,
              platformId: jsPlatform.id,
              expiresAt,
              isActive: true
            }
          })

          enrolledCount++
          console.log(`  ✅ Enrolled: ${user.name} (${user.email})`)
        } catch (error) {
          failedCount++
          failedUsers.push({ user, error: error.message })
          console.log(`  ❌ Failed to enroll: ${user.name} (${user.email}) - ${error.message}`)
        }
      }

      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < usersToEnroll.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Summary
    console.log('\n📈 ENROLLMENT SUMMARY:')
    console.log(`✅ Successfully enrolled: ${enrolledCount} users`)
    console.log(`❌ Failed enrollments: ${failedCount} users`)
    console.log(`📊 Total existing users: ${existingUsers.length}`)
    console.log(`📊 Previously enrolled: ${enrolledUserIds.size}`)
    console.log(`📊 Newly enrolled: ${enrolledCount}`)

    if (failedUsers.length > 0) {
      console.log('\n❌ FAILED ENROLLMENTS:')
      failedUsers.forEach(({ user, error }) => {
        console.log(`  - ${user.name} (${user.email}): ${error}`)
      })
    }

    console.log('\n🎉 Enrollment process completed!')

  } catch (error) {
    console.error('💥 Fatal error during enrollment process:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  enrollExistingUsersInJavaScriptTasks()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { enrollExistingUsersInJavaScriptTasks }