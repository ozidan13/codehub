import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSubmissionSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  summary: z.string().min(1, 'Summary is required')
})

// GET /api/submissions - Get submissions (students see their own, admins see all)
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
    const taskId = searchParams.get('taskId')
    const userId = searchParams.get('userId')

    let whereClause: any = {}

    if (session.user.role === 'STUDENT') {
      // Students can only see their own submissions
      whereClause.userId = session.user.id
    } else if (session.user.role === 'ADMIN') {
      // Admins can filter by userId if provided
      if (userId) {
        whereClause.userId = userId
      }
    }

    if (taskId) {
      whereClause.taskId = taskId
    }

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit

    const [submissions, total] = await prisma.$transaction([
      prisma.submission.findMany({
        where: whereClause,
        include: {
          task: {
            include: {
              platform: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.submission.count({ where: whereClause })
    ])

    return NextResponse.json({
      submissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Submissions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/submissions - Create new submission (Students only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized - Student access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { taskId, summary } = body

    // Validate required fields
    const validatedData = createSubmissionSchema.parse({ taskId, summary })

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has an active (pending or approved) submission for this task
    const activeSubmission = await prisma.submission.findFirst({
      where: {
        taskId,
        userId: session.user.id,
        status: {
          in: ['PENDING', 'APPROVED']
        }
      }
    })

    if (activeSubmission) {
      return NextResponse.json(
        { error: 'You already have an active submission for this task. You can submit again if it is rejected.' },
        { status: 400 }
      )
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        taskId: validatedData.taskId,
        userId: session.user.id,
        summary: validatedData.summary,
        status: 'PENDING'
      },
      include: {
        task: {
          include: {
            platform: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ submission }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Submission creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}