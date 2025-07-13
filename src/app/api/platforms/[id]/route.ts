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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeTasks = searchParams.get('include_tasks') === 'true'

    // Check if user has an active enrollment for this platform
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_platformId: {
          userId: session.user.id,
          platformId: id
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

    const platform = await prisma.platform.findUnique({
      where: { id },
      include: includeTasks ? {
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
      } : undefined
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Add enrollment status to response
    const daysRemaining = Math.ceil((enrollment.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return NextResponse.json({ 
      platform,
      enrollment: {
        id: enrollment.id,
        expiresAt: enrollment.expiresAt,
        daysRemaining,
        status: daysRemaining <= 7 ? 'expiring_soon' : 'active'
      }
    })

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      where: { id }
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

    const updatedPlatform = await prisma.platform.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ platform: updatedPlatform })

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Check if platform exists before checking for submissions
    const platformExists = await prisma.platform.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!platformExists) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    // More efficient check for submissions
    const submissionCount = await prisma.submission.count({
      where: {
        task: {
          platformId: id
        }
      }
    })

    if (submissionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete platform with existing submissions. Please delete them first.' },
        { status: 400 }
      )
    }

    // Delete platform (tasks will be deleted due to cascade)
    await prisma.platform.delete({
      where: { id }
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