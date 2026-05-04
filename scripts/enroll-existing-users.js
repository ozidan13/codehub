require('dotenv').config()

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DEFAULT_ACCESS_DAYS = Number.parseInt(process.env.ENROLL_ALL_ACCESS_DAYS || '365', 10)
const BATCH_SIZE = 100

function createExpiryDate(days) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + days)
  return expiresAt
}

async function enrollAllStudentsInAllPlatforms(options = {}) {
  const accessDays = options.accessDays || DEFAULT_ACCESS_DAYS
  const renewExisting = options.renewExisting ?? true
  const expiresAt = createExpiryDate(accessDays)

  const [students, platforms] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.platform.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' }
    })
  ])

  if (students.length === 0) {
    console.log('No student users found.')
    return { students: 0, platforms: platforms.length, created: 0, renewed: 0, unchanged: 0 }
  }

  if (platforms.length === 0) {
    console.log('No platforms found.')
    return { students: students.length, platforms: 0, created: 0, renewed: 0, unchanged: 0 }
  }

  const expectedPairs = students.length * platforms.length
  console.log(`Found ${students.length} students and ${platforms.length} platforms.`)
  console.log(`Processing ${expectedPairs} enrollment pairs.`)
  console.log(`Access duration: ${accessDays} days. Renew existing: ${renewExisting}.`)

  let created = 0
  let renewed = 0
  let unchanged = 0

  const studentIds = students.map((student) => student.id)
  const platformIds = platforms.map((platform) => platform.id)

  const existingEnrollments = await prisma.enrollment.findMany({
    where: {
      userId: { in: studentIds },
      platformId: { in: platformIds }
    },
    select: {
      id: true,
      userId: true,
      platformId: true,
      expiresAt: true,
      isActive: true
    }
  })

  const existingByPair = new Map(
    existingEnrollments.map((enrollment) => [
      `${enrollment.userId}:${enrollment.platformId}`,
      enrollment
    ])
  )

  const creates = []
  const renewalIds = []
  const now = new Date()

  for (const student of students) {
    for (const platform of platforms) {
      const key = `${student.id}:${platform.id}`
      const existing = existingByPair.get(key)

      if (!existing) {
        creates.push({
          userId: student.id,
          platformId: platform.id,
          expiresAt,
          isActive: true,
          lastRenewalAt: now
        })
        continue
      }

      if (renewExisting && (!existing.isActive || existing.expiresAt < expiresAt)) {
        renewalIds.push(existing.id)
      } else {
        unchanged += 1
      }
    }
  }

  for (let i = 0; i < creates.length; i += BATCH_SIZE) {
    const batch = creates.slice(i, i + BATCH_SIZE)
    const result = await prisma.enrollment.createMany({
      data: batch,
      skipDuplicates: true
    })
    created += result.count
  }

  for (let i = 0; i < renewalIds.length; i += BATCH_SIZE) {
    const batchIds = renewalIds.slice(i, i + BATCH_SIZE)
    const result = await prisma.enrollment.updateMany({
      where: { id: { in: batchIds } },
      data: {
        expiresAt,
        isActive: true,
        lastRenewalAt: now
      }
    })
    renewed += result.count
  }

  console.log('Enrollment complete.')
  console.log(`Created: ${created}`)
  console.log(`Renewed: ${renewed}`)
  console.log(`Unchanged: ${unchanged}`)

  return {
    students: students.length,
    platforms: platforms.length,
    created,
    renewed,
    unchanged
  }
}

if (require.main === module) {
  enrollAllStudentsInAllPlatforms()
    .catch((error) => {
      console.error('Failed to enroll students in platforms:', error)
      process.exitCode = 1
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

module.exports = { enrollAllStudentsInAllPlatforms }
