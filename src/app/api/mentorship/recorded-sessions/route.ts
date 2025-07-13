import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET - Fetch active recorded sessions for students
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const recordedSessions = await prisma.recordedSession.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(recordedSessions)
  } catch (error) {
    console.error('Error fetching recorded sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const purchaseSchema = z.object({
  recordedSessionId: z.string().min(1, 'Recorded session ID is required')
})

// POST - Purchase recorded session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { recordedSessionId } = purchaseSchema.parse(body)

    // Get the recorded session
    const recordedSession = await prisma.recordedSession.findUnique({
      where: { id: recordedSessionId }
    })

    if (!recordedSession || !recordedSession.isActive) {
      return NextResponse.json(
        { error: 'Recorded session not found or not available' },
        { status: 404 }
      )
    }

    // Get user's current balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has sufficient balance
    if (user.balance.toNumber() < recordedSession.price.toNumber()) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Check if user already purchased this recorded session
    const existingBooking = await prisma.mentorshipBooking.findFirst({
      where: {
        studentId: session.user.id,
        sessionType: 'RECORDED',
        videoLink: recordedSession.videoLink,
        status: 'CONFIRMED'
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You have already purchased this recorded session' },
        { status: 400 }
      )
    }

    // Get admin user (mentor)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 500 }
      )
    }

    // Create transaction and booking in a database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct balance
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            balance: {
              decrement: recordedSession.price.toNumber()
            }
          }
        })

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            type: 'DEBIT',
            amount: recordedSession.price.toNumber(),
            status: 'COMPLETED',
            description: `Purchase of recorded session: ${recordedSession.title}`
          }
        })

        // Create mentorship booking
        const booking = await tx.mentorshipBooking.create({
          data: {
            studentId: session.user.id,
            mentorId: mentor.id,
            sessionType: 'RECORDED',
            duration: 0, // Not applicable for recorded sessions
            amount: recordedSession.price.toNumber(),
          status: 'CONFIRMED',
          sessionDate: new Date(),
          videoLink: recordedSession.videoLink,
          studentNotes: `Purchased recorded session: ${recordedSession.title}`
        }
      })

      return { transaction, booking }
    })

    return NextResponse.json({
      message: 'Recorded session purchased successfully',
      booking: result.booking,
      videoLink: recordedSession.videoLink
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error purchasing recorded session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}