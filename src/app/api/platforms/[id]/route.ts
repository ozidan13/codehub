import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePlatformSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  url: z.string().url('Invalid URL format').optional()
})

// GET /api/platforms/[id] - Get single platform
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

    const platform = await prisma.platform.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            submissions: {
              where: { userId: session.user.id },
              select: {
                id: true,
                status: true,
                score: true,
                feedback: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        }
      }
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ platform })

  } catch (error) {
    console.error('Platform fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/platforms/[id] - Update platform (Admin only)
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
    const updateData = updatePlatformSchema.parse(body)

    // Check if platform exists
    const existingPlatform = await prisma.platform.findUnique({
      where: { id: params.id }
    })

    if (!existingPlatform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Check if name is unique (if being updated)
    if (updateData.name && updateData.name !== existingPlatform.name) {
      const nameExists = await prisma.platform.findUnique({
        where: { name: updateData.name }
      })
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Platform name already exists' },
          { status: 400 }
        )
      }
    }

    const platform = await prisma.platform.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({ platform })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Platform update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/platforms/[id] - Delete platform (Admin only)
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

    // Check if platform exists
    const platform = await prisma.platform.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          include: {
            submissions: true
          }
        }
      }
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Check if platform has submissions
    const hasSubmissions = platform.tasks.some(task => task.submissions.length > 0)
    
    if (hasSubmissions) {
      return NextResponse.json(
        { error: 'Cannot delete platform with existing submissions' },
        { status: 400 }
      )
    }

    // Delete platform (tasks will be deleted due to cascade)
    await prisma.platform.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Platform deleted successfully' })

  } catch (error) {
    console.error('Platform deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}