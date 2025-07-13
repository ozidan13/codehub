import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const availableDateSchema = z.object({
  date: z.string().datetime(),
  timeSlot: z.string().min(1)
})

const bulkCreateSchema = z.object({
  generateWeekly: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  weeks: z.number().min(1).max(12).optional(),
  dates: z.array(availableDateSchema).optional()
})

// GET /api/admin/available-dates - Get all available dates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const availableDates = await prisma.availableDate.findMany({
      orderBy: { timeSlot: 'asc' }
    })

    // Get booking details for booked dates
    const bookedDates = availableDates.filter(date => date.isBooked && date.bookingId)
    const bookingIds = bookedDates.map(date => date.bookingId!)
    
    const bookings = bookingIds.length > 0 ? await prisma.mentorshipBooking.findMany({
      where: { id: { in: bookingIds } },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }) : []

    // Combine the data
    const availableDatesWithBookings = availableDates.map(date => ({
      ...date,
      booking: date.bookingId ? bookings.find(b => b.id === date.bookingId) : null
    }))

    return NextResponse.json({ availableDates: availableDatesWithBookings })
  } catch (error) {
    console.error('Error fetching available dates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/available-dates - Create new available date(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check if it's a single date creation or bulk creation
    if (body.generateWeekly || body.dates) {
      const { generateWeekly, startDate, weeks = 4, dates } = bulkCreateSchema.parse(body)
      
      if (generateWeekly) {
        // Generate weekly day-time slots (recurring pattern)
        const generatedDates = []
        
        // Days from Friday to Thursday
        const dayNames = ['friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
        
        // Time slots from 6 AM to 7 PM
        const timeSlots = [
          '6:00 am', '7:00 am', '8:00 am', '9:00 am', '10:00 am', '11:00 am',
          '12:00 pm', '1:00 pm', '2:00 pm', '3:00 pm', '4:00 pm', '5:00 pm', '6:00 pm'
        ]
        
        // Create a base date for reference
        const baseDate = new Date('2025-01-01T00:00:00Z')
        
        // Generate day-time combinations
        dayNames.forEach((dayName, dayIndex) => {
          timeSlots.forEach((timeSlot, timeIndex) => {
            // Create a unique date for each day-time combination
            const slotDate = new Date(baseDate)
            slotDate.setDate(baseDate.getDate() + dayIndex)
            slotDate.setHours(timeIndex + 6, 0, 0, 0) // Start from 6 AM
            
            generatedDates.push({
              date: slotDate,
              timeSlot: `${dayName} ${timeSlot}`,
              isBooked: false
            })
          })
        })

        // Create dates in bulk, skip existing ones
        const createdDates = []
        for (const dateData of generatedDates) {
          try {
            const created = await prisma.availableDate.create({
              data: dateData
            })
            createdDates.push(created)
          } catch (error: any) {
            // Skip if date already exists (unique constraint)
            if (error.code !== 'P2002') {
              throw error
            }
          }
        }

        return NextResponse.json({
          message: `Created ${createdDates.length} day-time slots (Friday-Thursday, 6 AM-7 PM)`,
          createdCount: createdDates.length,
          totalGenerated: generatedDates.length
        })
      } else if (dates && Array.isArray(dates)) {
        // Create specific dates
        const createdDates = []
        
        for (const dateData of dates) {
          try {
            const created = await prisma.availableDate.create({
              data: {
                date: new Date(dateData.date),
                timeSlot: dateData.timeSlot,
                isBooked: false
              }
            })
            createdDates.push(created)
          } catch (error: any) {
            // Skip if date already exists
            if (error.code !== 'P2002') {
              throw error
            }
          }
        }

        return NextResponse.json({
          message: `Created ${createdDates.length} available dates`,
          createdDates
        })
      }
    } else {
      // Single date creation
      const { date, timeSlot } = availableDateSchema.parse(body)

      // Check if this date and time slot already exists
      const existingDate = await prisma.availableDate.findUnique({
        where: {
          date_timeSlot: {
            date: new Date(date),
            timeSlot
          }
        }
      })

      if (existingDate) {
        return NextResponse.json({ error: 'This date and time slot already exists' }, { status: 400 })
      }

      const availableDate = await prisma.availableDate.create({
        data: {
          date: new Date(date),
          timeSlot,
          isBooked: false
        }
      })

      return NextResponse.json({ 
        message: 'Available date created successfully',
        availableDate 
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating available date(s):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/available-dates - Delete available date
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateId = searchParams.get('id')

    if (!dateId) {
      return NextResponse.json({ error: 'Date ID is required' }, { status: 400 })
    }

    // Check if the date is booked
    const availableDate = await prisma.availableDate.findUnique({
      where: { id: dateId }
    })

    if (!availableDate) {
      return NextResponse.json({ error: 'Available date not found' }, { status: 404 })
    }

    if (availableDate.isBooked) {
      return NextResponse.json({ error: 'Cannot delete a booked date' }, { status: 400 })
    }

    await prisma.availableDate.delete({
      where: { id: dateId }
    })

    return NextResponse.json({ message: 'Available date deleted successfully' })
  } catch (error) {
    console.error('Error deleting available date:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}