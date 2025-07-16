import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to format date as DD/MM/YYYY
function formatDateDMY(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper function to group dates by day
function groupDatesByDay(dates: any[]) {
  const grouped = dates.reduce((acc, date) => {
    const dayKey = formatDateDMY(date.date)
    if (!acc[dayKey]) {
      acc[dayKey] = {
        date: date.date,
        formattedDate: dayKey,
        dayOfWeek: date.date.toLocaleDateString('en-US', { weekday: 'long' }),
        timeSlots: []
      }
    }
    acc[dayKey].timeSlots.push({
      id: date.id,
      startTime: date.startTime,
      endTime: date.endTime,
      timeSlot: `${date.startTime} - ${date.endTime}`,
      isRecurring: date.isRecurring
    })
    return acc
  }, {})

  // Convert to array and sort by date
  return Object.values(grouped).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

// GET - Fetch available dates for students (only unbooked dates)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const grouped = searchParams.get('grouped') === 'true'

    // Build where clause
    const whereClause: any = {
      isBooked: false
    }
    
    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else {
      // Default: only show future dates
      whereClause.date = {
        gte: new Date()
      }
    }

    // Get only unbooked date slots
    const availableDates = await prisma.availableDate.findMany({
      where: whereClause,
      orderBy: [
        { date: 'asc' },
        { id: 'asc' }
      ]
    })

    // Format dates for frontend
    const formattedDates = availableDates.map(date => ({
      ...date,
      formattedDate: formatDateDMY(date.date),
      timeSlot: `${date.startTime} - ${date.endTime}`,
      dayOfWeek: date.date.toLocaleDateString('en-US', { weekday: 'long' })
    }))

    if (grouped) {
      // Return dates grouped by day (Calendly-style)
      const groupedDates = groupDatesByDay(formattedDates)
      return NextResponse.json({
        availableDates: groupedDates,
        total: formattedDates.length,
        grouped: true
      })
    }

    // Return flat list of dates
    return NextResponse.json({
      availableDates: formattedDates,
      total: formattedDates.length,
      grouped: false
    })
  } catch (error) {
    console.error('Error fetching available dates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}