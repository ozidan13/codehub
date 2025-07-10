import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  link: z.string().url().optional(),
  platformId: z.string().min(1, 'Platform ID is required'),
  order: z.number().int().min(0).optional()
})

// GET /api/tasks - Get all tasks (with optional platform filter)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId')

    // If platformId is specified, check enrollment
    if (platformId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_platformId: {
            userId: session.user.id,
            platformId
          }
        },
        select: {
          id: true,
          userId: true,
          platformId: true,
          createdAt: true,
          expiresAt: true
        }
      })

      // If no enrollment exists, deny access
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Access denied. You must enroll in this platform first.' },
          { status: 403 }
        )
      }

      // Check if enrollment is expired
      const now = new Date()
      if (now > enrollment.expiresAt) {
        return NextResponse.json(
          { 
            error: 'Access denied. Your enrollment has expired. Please renew to continue.',
            enrollmentExpired: true,
            enrollmentId: enrollment.id
          },
          { status: 403 }
        )
      }
    }

    const whereClause = platformId ? { platformId } : {}

    const includeSubmissions = searchParams.get('include_submissions') === 'true'

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            url: true
          }
        },
        submissions: includeSubmissions ? {
          where: { userId: session.user.id },
          select: {
            id: true,
            status: true,
            score: true,
            feedback: true,
            summary: true,
            createdAt: true,
            updatedAt: true
          }
        } : undefined
      },
      orderBy: [{ platformId: 'asc' }, { order: 'asc' }]
    })

    return NextResponse.json({ tasks })

  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create new task (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, link, platformId, order } = createTaskSchema.parse(body)

    // Verify platform exists
    const platform = await prisma.platform.findUnique({
      where: { id: platformId }
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Get next order number if not provided
    let taskOrder = order
    if (taskOrder === undefined) {
      const lastTask = await prisma.task.findFirst({
        where: { platformId },
        orderBy: { order: 'desc' }
      })
      taskOrder = (lastTask?.order || 0) + 1
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        link,
        platformId,
        order: taskOrder
      },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            url: true
          }
        }
      }
    })

    return NextResponse.json({ task }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Task creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}