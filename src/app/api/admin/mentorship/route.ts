import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBookingSchema = z.object({
  bookingId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  sessionDate: z.string().optional(),
  meetingLink: z.string().url().optional(),
  videoLink: z.string().url().optional(),
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

    // Get statistics
    const allBookings = await prisma.mentorshipBooking.findMany({
      select: {
        status: true,
        sessionType: true,
        amount: true
      }
    })

    const stats = {
      total: allBookings.length,
      pending: allBookings.filter(b => b.status === 'PENDING').length,
      confirmed: allBookings.filter(b => b.status === 'CONFIRMED').length,
      completed: allBookings.filter(b => b.status === 'COMPLETED').length,
      cancelled: allBookings.filter(b => b.status === 'CANCELLED').length,
      recordedSessions: allBookings.filter(b => b.sessionType === 'RECORDED').length,
      faceToFaceSessions: allBookings.filter(b => b.sessionType === 'FACE_TO_FACE').length,
      totalRevenue: allBookings
        .filter(b => b.status !== 'CANCELLED')
        .reduce((sum, b) => sum + b.amount.toNumber(), 0)
    }

    return NextResponse.json({
      bookings,
      stats,
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
    const { bookingId, status, sessionDate, meetingLink, videoLink, adminNotes } = updateBookingSchema.parse(body)

    const booking = await prisma.mentorshipBooking.findUnique({
      where: { id: bookingId },
      include: { student: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (adminNotes) updateData.adminNotes = adminNotes
    if (meetingLink) updateData.meetingLink = meetingLink
    if (videoLink) updateData.videoLink = videoLink
    
    // Handle session date changes for face-to-face sessions
    if (sessionDate && booking.sessionType === 'FACE_TO_FACE') {
      const newSessionDate = new Date(sessionDate)
      if (newSessionDate.getTime() !== booking.sessionDate?.getTime()) {
        updateData.sessionDate = newSessionDate
        updateData.dateChanged = true
        updateData.originalSessionDate = booking.originalSessionDate || booking.sessionDate
        
        // Update available dates - free up old slot and book new slot
        if (booking.sessionDate) {
          // Free up the old slot
          await prisma.availableDate.updateMany({
            where: {
              date: booking.sessionDate,
              bookingId: bookingId
            },
            data: {
              isBooked: false,
              bookingId: null
            }
          })
        }
        
        // Book the new slot (find matching available date)
        const newSlot = await prisma.availableDate.findFirst({
          where: {
            date: {
              gte: new Date(newSessionDate.getFullYear(), newSessionDate.getMonth(), newSessionDate.getDate()),
              lt: new Date(newSessionDate.getFullYear(), newSessionDate.getMonth(), newSessionDate.getDate() + 1)
            },
            isBooked: false
          }
        })
        
        if (newSlot) {
          await prisma.availableDate.update({
            where: { id: newSlot.id },
            data: {
              isBooked: true,
              bookingId: bookingId
            }
          })
        }
      }
    } else if (sessionDate) {
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

        // Free up available date slot for face-to-face sessions
        if (booking.sessionType === 'FACE_TO_FACE' && booking.sessionDate) {
          await tx.availableDate.updateMany({
            where: {
              date: booking.sessionDate,
              bookingId: bookingId
            },
            data: {
              isBooked: false,
              bookingId: null
            }
          })
        }

        // Refund student
        await tx.user.update({
          where: { id: booking.studentId },
          data: { balance: { increment: booking.amount } }
        })

        // Create refund transaction with appropriate type
        const refundType = booking.sessionType === 'RECORDED' ? 'RECORDED_SESSION' : 'FACE_TO_FACE_SESSION'
        await tx.transaction.create({
          data: {
            userId: booking.studentId,
            type: refundType,
            amount: `-${booking.amount.toString()}`, // Negative amount for refund
            status: 'APPROVED',
            description: `Refund for cancelled ${booking.sessionType === 'RECORDED' ? 'recorded' : 'face-to-face'} mentorship session`
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
        message: `Booking ${status ? status.toLowerCase() : 'updated'} successfully`,
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