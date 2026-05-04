require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { newPlatforms, newPlatformTasks } = require('../prisma/new-learning-platforms')

const prisma = new PrismaClient()

async function main() {
  let platformCount = 0
  let taskCount = 0

  for (const platformData of newPlatforms) {
    const platform = await prisma.platform.upsert({
      where: { name: platformData.name },
      update: {
        description: platformData.description,
        url: platformData.url,
        courseLink: platformData.courseLink,
        price: platformData.price,
        isPaid: platformData.isPaid
      },
      create: platformData
    })
    platformCount += 1

    const tasks = newPlatformTasks[platform.name] || []
    for (const task of tasks) {
      await prisma.task.upsert({
        where: {
          id: `${platform.id}-task-${task.order}`
        },
        update: {
          title: task.title,
          description: task.description,
          link: task.link,
          order: task.order,
          platformId: platform.id
        },
        create: {
          ...task,
          id: `${platform.id}-task-${task.order}`,
          platformId: platform.id
        }
      })
      taskCount += 1
    }
  }

  console.log(`Upserted ${platformCount} platforms and ${taskCount} tasks.`)
}

main()
  .catch((error) => {
    console.error('Failed to add learning platforms:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
