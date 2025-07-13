import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch available dates for students (only unbooked dates)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get only unbooked day-time slots
    const availableDates = await prisma.availableDate.findMany({
      where: {
        isBooked: false
      },
      orderBy: [{ timeSlot: 'asc' }]
    })

    return NextResponse.json(availableDates)
  } catch (error) {
    console.error('Error fetching available dates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}