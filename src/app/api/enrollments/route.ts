import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const enrollmentSchema = z.object({
  platformId: z.string().min(1)
})

// GET /api/enrollments - Get user enrollments
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            description: true,
            url: true,
            price: true,
            isPaid: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/enrollments - Enroll in a platform
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platformId } = enrollmentSchema.parse(body)

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_platformId: {
          userId: session.user.id,
          platformId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this platform' }, { status: 400 })
    }

    // Get platform details
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
      select: { id: true, name: true, price: true, isPaid: true }
    })

    if (!platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    // If platform is paid, check user balance and process payment
    if (platform.isPaid && platform.price) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true }
      })

      if (!user || user.balance.toNumber() < (platform.price?.toNumber() || 0)) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }

      // Process enrollment with payment in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct balance
        await tx.user.update({
          where: { id: session.user.id },
          data: { balance: { decrement: platform.price || 0 } }
        })

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            type: 'PLATFORM_PURCHASE',
            amount: platform.price?.toString() || '0',
            status: 'APPROVED',
            description: `Enrolled in ${platform.name}`
          }
        })

        // Create enrollment
        const enrollment = await tx.enrollment.create({
          data: {
            userId: session.user.id,
            platformId
          },
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                description: true,
                url: true,
                price: true,
                isPaid: true
              }
            }
          }
        })

        return enrollment
      })

      return NextResponse.json({ 
        message: 'Successfully enrolled in platform',
        enrollment: result
      })
    } else {
      // Free platform enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: session.user.id,
          platformId
        },
        include: {
          platform: {
            select: {
              id: true,
              name: true,
              description: true,
              url: true,
              price: true,
              isPaid: true
            }
          }
        }
      })

      return NextResponse.json({ 
        message: 'Successfully enrolled in platform',
        enrollment
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    console.error('Error creating enrollment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}