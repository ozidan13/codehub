import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  link: z.string().url('Invalid URL format').optional(),
  platformId: z.string().min(1, 'Platform ID is required').optional(),
  order: z.number().int().min(0).optional()
})

// GET /api/tasks/[id] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            url: true
          }
        },
        submissions: {
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
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ task })

  } catch (error) {
    console.error('Task fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id] - Update task (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData = updateTaskSchema.parse(body)

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // If platformId is being updated, verify the new platform exists
    if (updateData.platformId && updateData.platformId !== existingTask.platformId) {
      const platform = await prisma.platform.findUnique({
        where: { id: updateData.platformId }
      })
      
      if (!platform) {
        return NextResponse.json(
          { error: 'Platform not found' },
          { status: 404 }
        )
      }
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ task })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Task update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete task (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        submissions: true
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if task has submissions
    if (task.submissions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete task with existing submissions' },
        { status: 400 }
      )
    }

    // Delete task
    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })

  } catch (error) {
    console.error('Task deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}