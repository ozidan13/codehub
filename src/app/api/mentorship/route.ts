import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bookingSchema = z.object({
  duration: z.number().min(30).max(180).default(60),
  studentNotes: z.string().optional()
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
      include: {
        mentor: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      mentor,
      bookings
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
    const { duration, studentNotes } = bookingSchema.parse(body)

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

    if (!mentor || !mentor.mentorRate) {
      return NextResponse.json({ error: 'No mentor available' }, { status: 404 })
    }

    // Calculate session cost
    const hourlyRate = mentor.mentorRate.toNumber()
    const sessionCost = (hourlyRate * duration) / 60

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
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'MENTORSHIP_PAYMENT',
          amount: sessionCost.toString(),
          status: 'APPROVED',
          description: `Mentorship session booking (${duration} minutes)`
        }
      })

      // Create booking
      const booking = await tx.mentorshipBooking.create({
        data: {
          studentId: session.user.id,
          mentorId: mentor.id,
          duration,
          amount: sessionCost,
          status: 'PENDING',
          studentNotes
        },
        include: {
          mentor: {
            select: {
              name: true
            }
          }
        }
      })

      return booking
    })

    return NextResponse.json({ 
      message: 'Mentorship session booked successfully. Payment deducted. Awaiting admin confirmation.',
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