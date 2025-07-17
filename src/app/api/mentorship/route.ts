import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bookingSchema = z.object({
  sessionType: z.enum(['RECORDED', 'FACE_TO_FACE']),
  duration: z.number().min(30).max(180).default(60),
  studentNotes: z.string().optional(),
  whatsappNumber: z.string().optional(),
  selectedDateId: z.string().optional(),
  recordedSessionId: z.string().optional()
})

// GET /api/mentorship - Get mentorship pricing and user bookings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get mentor (admin) details
    const mentor = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN',
        isMentor: true
      },
      select: {
        id: true,
        name: true,
        mentorBio: true,
        mentorRate: true
      }
    })

    if (!mentor) {
      return NextResponse.json({ error: 'No mentor available' }, { status: 404 })
    }

    // Get user's bookings
    const bookings = await prisma.mentorshipBooking.findMany({
      where: { studentId: session.user.id },
      select: {
        id: true,
        duration: true,
        amount: true,
        status: true,
        sessionType: true,
        sessionDate: true,
        sessionStartTime: true,
        sessionEndTime: true,
        videoLink: true,
        meetingLink: true,
        whatsappNumber: true,
        studentNotes: true,
        adminNotes: true,
        createdAt: true,
        mentor: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get available dates for face-to-face sessions
    const availableDates = await prisma.availableDate.findMany({
      where: {
        isBooked: false,
        date: {
          gte: new Date() // Only future dates
        }
      },
      orderBy: [
        { date: 'asc' },
        { id: 'asc' }
      ]
    })

    // Format dates for frontend
    const formattedAvailableDates = availableDates.map(date => ({
      ...date,
      formattedDate: `${date.date.getDate().toString().padStart(2, '0')}/${(date.date.getMonth() + 1).toString().padStart(2, '0')}/${date.date.getFullYear()}`,
      timeSlot: `${date.startTime} - ${date.endTime}`,
      dayOfWeek: date.date.toLocaleDateString('en-US', { weekday: 'long' })
    }))

    // Get recorded sessions
    const recordedSessions = await prisma.recordedSession.findMany({
      where: {
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      mentor,
      bookings,
      availableDates: formattedAvailableDates,
      recordedSessions,
      pricing: {
        recordedSession: 100,
        faceToFaceSession: 500
      }
    })
  } catch (error) {
    console.error('Error fetching mentorship data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/mentorship - Book mentorship session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionType, duration, studentNotes, whatsappNumber, selectedDateId, recordedSessionId } = bookingSchema.parse(body)

    // Validate session type specific requirements
    if (sessionType === 'RECORDED') {
      if (!recordedSessionId) {
        return NextResponse.json({ error: 'Please select a recorded session' }, { status: 400 })
      }
    }
    
    if (sessionType === 'FACE_TO_FACE') {
      if (!whatsappNumber) {
        return NextResponse.json({ error: 'WhatsApp number is required for face-to-face sessions' }, { status: 400 })
      }
      if (!selectedDateId) {
        return NextResponse.json({ error: 'Please select an available date for face-to-face sessions' }, { status: 400 })
      }
    }

    // Get mentor (admin) details
    const mentor = await prisma.user.findFirst({
      where: { 
        role: 'ADMIN',
        isMentor: true
      },
      select: {
        id: true,
        mentorRate: true
      }
    })

    if (!mentor) {
      return NextResponse.json({ error: 'No mentor available' }, { status: 404 })
    }

    // Calculate session cost based on session type
    let sessionCost: number
    let selectedDate: any = null
    let recordedSession: any = null
    
    if (sessionType === 'RECORDED') {
      // Get the selected recorded session
      recordedSession = await prisma.recordedSession.findUnique({
        where: { id: recordedSessionId }
      })
      
      if (!recordedSession || !recordedSession.isActive) {
        return NextResponse.json({ error: 'Selected recorded session is not available' }, { status: 400 })
      }
      
      sessionCost = recordedSession.price.toNumber()
    } else {
      sessionCost = 500 // Fixed price for face-to-face sessions
      
      // Verify and reserve the selected date
      selectedDate = await prisma.availableDate.findUnique({
        where: { id: selectedDateId }
      })
      
      if (!selectedDate || selectedDate.isBooked) {
        return NextResponse.json({ error: 'Selected date is no longer available' }, { status: 400 })
      }
    }

    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    })

    if (!user || user.balance.toNumber() < sessionCost) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Process booking with payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct balance immediately
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: sessionCost } }
      })

      // Create transaction record
      const transactionType = sessionType === 'RECORDED' ? 'RECORDED_SESSION' : 'FACE_TO_FACE_SESSION'
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: transactionType,
          amount: sessionCost.toString(),
          status: 'APPROVED',
          description: `${sessionType === 'RECORDED' ? 'Recorded' : 'Face-to-face'} mentorship session booking (${duration} minutes)`
        }
      })

      // Create booking with session type specific data
      const bookingData: any = {
        studentId: session.user.id,
        mentorId: mentor.id,
        sessionType,
        duration,
        amount: sessionCost,
        status: sessionType === 'RECORDED' ? 'CONFIRMED' : 'PENDING',
        studentNotes,
        dateChanged: false
      }

      if (sessionType === 'RECORDED') {
        // For recorded sessions, use the selected recorded session
        bookingData.videoLink = recordedSession.videoLink
        bookingData.sessionDate = new Date()
      } else {
        // For face-to-face sessions, set the selected date and time details
        bookingData.sessionDate = selectedDate.date
        bookingData.originalSessionDate = selectedDate.date
        bookingData.sessionStartTime = selectedDate.startTime
        bookingData.sessionEndTime = selectedDate.endTime
        bookingData.availableDateId = selectedDate.id
        bookingData.whatsappNumber = whatsappNumber
      }

      const booking = await tx.mentorshipBooking.create({
        data: bookingData,
        include: {
          mentor: {
            select: {
              name: true
            }
          }
        }
      })

      // For face-to-face sessions, mark the date as booked and link to booking
      if (sessionType === 'FACE_TO_FACE' && selectedDate) {
        await tx.availableDate.update({
          where: { id: selectedDateId },
          data: { 
            isBooked: true
          }
        })
      }

      return booking
    })

    const message = sessionType === 'RECORDED' 
      ? 'Recorded session booked successfully! Your video link is ready.'
      : 'Face-to-face session booked successfully! Awaiting admin confirmation.'
    
    return NextResponse.json({ 
      message,
      booking: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    console.error('Error creating mentorship booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}