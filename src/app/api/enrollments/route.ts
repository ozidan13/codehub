import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const enrollmentSchema = z.object({
  platformId: z.string().min(1)
})

const renewalSchema = z.object({
  enrollmentId: z.string().min(1)
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
      select: {
        id: true,
        userId: true,
        platformId: true,
        createdAt: true,
        expiresAt: true,
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

    // Add expiration status to each enrollment
    const enrollmentsWithStatus = enrollments.map(enrollment => {
      const now = new Date()
      const isExpired = now > enrollment.expiresAt
      const daysRemaining = Math.ceil((enrollment.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        ...enrollment,
        isExpired,
        daysRemaining: isExpired ? 0 : daysRemaining,
        status: isExpired ? 'expired' : (daysRemaining <= 7 ? 'expiring_soon' : 'active')
      }
    })

    return NextResponse.json({ enrollments: enrollmentsWithStatus })
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

        // Create enrollment with 30-day expiration
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)
        
        const enrollment = await tx.enrollment.create({
          data: {
            userId: session.user.id,
            platformId,
            expiresAt
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
      // Free platform enrollment with 30-day expiration
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)
      
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: session.user.id,
          platformId,
          expiresAt
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

// PUT /api/enrollments - Renew an expired enrollment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { enrollmentId } = renewalSchema.parse(body)

    // Find the enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        userId: session.user.id
      },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            price: true,
            isPaid: true
          }
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Check if enrollment is actually expired
    const now = new Date()
    if (now <= enrollment.expiresAt) {
      return NextResponse.json({ error: 'Enrollment is still active' }, { status: 400 })
    }

    // If platform is paid, check user balance and process payment
    if (enrollment.platform.isPaid && enrollment.platform.price) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true }
      })

      if (!user || user.balance.toNumber() < (enrollment.platform.price?.toNumber() || 0)) {
        return NextResponse.json({ error: 'Insufficient balance for renewal' }, { status: 400 })
      }

      // Process renewal with payment in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct balance
        await tx.user.update({
          where: { id: session.user.id },
          data: { balance: { decrement: enrollment.platform.price || 0 } }
        })

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            type: 'PLATFORM_PURCHASE',
            amount: enrollment.platform.price?.toString() || '0',
            status: 'APPROVED',
            description: `Renewed enrollment in ${enrollment.platform.name}`
          }
        })

        // Update enrollment with new expiration date
        const newExpiresAt = new Date()
        newExpiresAt.setDate(newExpiresAt.getDate() + 30)
        
        const updatedEnrollment = await tx.enrollment.update({
          where: { id: enrollmentId },
          data: {
            expiresAt: newExpiresAt,
            isActive: true,
            lastRenewalAt: new Date()
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

        return updatedEnrollment
      })

      return NextResponse.json({ 
        message: 'Successfully renewed enrollment',
        enrollment: result
      })
    } else {
      // Free platform renewal
      const newExpiresAt = new Date()
      newExpiresAt.setDate(newExpiresAt.getDate() + 30)
      
      const updatedEnrollment = await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          expiresAt: newExpiresAt,
          isActive: true,
          lastRenewalAt: new Date()
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
        message: 'Successfully renewed enrollment',
        enrollment: updatedEnrollment
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    console.error('Error renewing enrollment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}