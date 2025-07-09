import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBookingSchema = z.object({
  bookingId: z.string(),
  status: z.enum(['CONFIRMED', 'CANCELLED']),
  sessionDate: z.string().optional(),
  adminNotes: z.string().optional()
})

const updateMentorSettingsSchema = z.object({
  mentorRate: z.number().min(10).max(200),
  mentorBio: z.string().min(10).max(500)
})

// GET /api/admin/mentorship - Get all mentorship bookings for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status

    const [bookings, total] = await Promise.all([
      prisma.mentorshipBooking.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          mentor: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.mentorshipBooking.count({ where })
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching admin mentorship bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/mentorship - Update booking status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, status, sessionDate, adminNotes } = updateBookingSchema.parse(body)

    const booking = await prisma.mentorshipBooking.findUnique({
      where: { id: bookingId },
      include: { student: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Booking already processed' }, { status: 400 })
    }

    const updateData: any = { status, adminNotes }
    
    if (status === 'CONFIRMED' && sessionDate) {
      updateData.sessionDate = new Date(sessionDate)
    }

    // If cancelling, refund the student
    if (status === 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        // Update booking
        await tx.mentorshipBooking.update({
          where: { id: bookingId },
          data: updateData
        })

        // Refund student
        await tx.user.update({
          where: { id: booking.studentId },
          data: { balance: { increment: booking.amount } }
        })

        // Create refund transaction
        await tx.transaction.create({
          data: {
            userId: booking.studentId,
            type: 'TOP_UP',
            amount: booking.amount.toString(),
            status: 'APPROVED',
            description: `Refund for cancelled mentorship session`
          }
        })
      })

      return NextResponse.json({ 
        message: 'Booking cancelled and student refunded successfully'
      })
    } else {
      // Just update booking
      const updatedBooking = await prisma.mentorshipBooking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          student: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      return NextResponse.json({ 
        message: `Booking ${status.toLowerCase()} successfully`,
        booking: updatedBooking
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    console.error('Error updating mentorship booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/mentorship - Update mentor settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { mentorRate, mentorBio } = updateMentorSettingsSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mentorRate,
        mentorBio,
        isMentor: true
      },
      select: {
        mentorRate: true,
        mentorBio: true,
        isMentor: true
      }
    })

    return NextResponse.json({ 
      message: 'Mentor settings updated successfully',
      settings: updatedUser
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    console.error('Error updating mentor settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}