import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating a single available date slot
const availableDateSchema = z.object({
  date: z.string().datetime(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isRecurring: z.boolean().optional().default(false),
  dayOfWeek: z.number().min(0).max(6).optional() // 0 = Sunday, 6 = Saturday
})

// Schema for bulk creation
const bulkCreateSchema = z.object({
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }).optional(),
  timeSlots: z.array(z.object({
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  })).optional(),
  excludeWeekends: z.boolean().optional().default(true),
  recurringTemplate: z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }).optional(),
  dates: z.array(availableDateSchema).optional()
})

// Helper function to format date as DD/MM/YYYY
function formatDateDMY(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper function to check if date is weekend
function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

// GET /api/admin/available-dates - Get all available dates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const includeBooked = searchParams.get('includeBooked') === 'true'

    // Build where clause
    const whereClause: any = {}
    
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (!includeBooked) {
      whereClause.isBooked = false
    }

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
      timeSlot: `${date.startTime} - ${date.endTime}`
    }))

    return NextResponse.json({ 
      availableDates: formattedDates,
      total: formattedDates.length
    })
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
    
    // Check if it's bulk creation or single date creation
    if (body.dateRange || body.dates || body.recurringTemplate) {
      const { dateRange, timeSlots, excludeWeekends, recurringTemplate, dates } = bulkCreateSchema.parse(body)
      
      if (recurringTemplate) {
        // Create recurring template
        const created = await prisma.availableDate.create({
          data: {
            date: new Date('2025-01-01'), // Template date
            startTime: recurringTemplate.startTime,
            endTime: recurringTemplate.endTime,
            timeSlot: `${recurringTemplate.startTime} - ${recurringTemplate.endTime}`,
            isRecurring: true,
            dayOfWeek: recurringTemplate.dayOfWeek,
            isBooked: false
          }
        })

        return NextResponse.json({
          message: 'Recurring template created successfully',
          template: created
        })
      }
      
      if (dateRange && timeSlots) {
        // Generate dates for range
        const generatedDates = []
        const start = new Date(dateRange.startDate)
        const end = new Date(dateRange.endDate)
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          // Skip weekends if requested
          if (excludeWeekends && isWeekend(date)) {
            continue
          }
          
          // Create slots for each time slot
          for (const slot of timeSlots) {
            generatedDates.push({
              date: new Date(date),
              startTime: slot.startTime,
              endTime: slot.endTime,
              timeSlot: `${slot.startTime} - ${slot.endTime}`,
              isRecurring: false,
              isBooked: false
            })
          }
        }

        // Create dates in batches
        const createdDates = []
        const batchSize = 100
        
        for (let i = 0; i < generatedDates.length; i += batchSize) {
          const batch = generatedDates.slice(i, i + batchSize)
          
          try {
            const batchResults = await Promise.allSettled(
              batch.map(dateData => 
                prisma.availableDate.create({ data: dateData })
              )
            )
            
            batchResults.forEach((result, index) => {
              if (result.status === 'fulfilled') {
                createdDates.push(result.value)
              }
            })
          } catch (error) {
            console.error('Batch creation error:', error)
          }
        }

        return NextResponse.json({
          message: `Created ${createdDates.length} available date slots`,
          createdCount: createdDates.length,
          totalGenerated: generatedDates.length
        })
      }
      
      if (dates && Array.isArray(dates)) {
        // Create specific dates
        const createdDates = []
        
        for (const dateData of dates) {
          try {
            const created = await prisma.availableDate.create({
              data: {
                date: new Date(dateData.date),
                startTime: dateData.startTime,
                endTime: dateData.endTime,
                timeSlot: `${dateData.startTime} - ${dateData.endTime}`,
                isRecurring: dateData.isRecurring || false,
                dayOfWeek: dateData.dayOfWeek,
                isBooked: false
              }
            })
            createdDates.push(created)
          } catch (error: any) {
            // Skip if date already exists (unique constraint)
            if (error.code !== 'P2002') {
              console.error('Error creating date:', error)
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
      const { date, startTime, endTime, isRecurring, dayOfWeek } = availableDateSchema.parse(body)

      // Check if this date and time slot already exists
      const existingDate = await prisma.availableDate.findFirst({
        where: {
          date: new Date(date),
          startTime,
          endTime
        }
      })

      if (existingDate) {
        return NextResponse.json({ error: 'This date and time slot already exists' }, { status: 400 })
      }

      const availableDate = await prisma.availableDate.create({
        data: {
          date: new Date(date),
          startTime,
          endTime,
          timeSlot: `${startTime} - ${endTime}`,
          isRecurring: isRecurring || false,
          dayOfWeek,
          isBooked: false
        }
      })

      return NextResponse.json({ 
        message: 'Available date created successfully',
        availableDate: {
          ...availableDate,
          formattedDate: formatDateDMY(availableDate.date),
          timeSlot: `${availableDate.startTime} - ${availableDate.endTime}`
        }
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

// PUT /api/admin/available-dates - Update available date
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, date, startTime, endTime, isRecurring, dayOfWeek } = z.object({
      id: z.string(),
      date: z.string().datetime().optional(),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      isRecurring: z.boolean().optional(),
      dayOfWeek: z.number().min(0).max(6).optional()
    }).parse(body)

    // Check if the date exists and is not booked
    const existingDate = await prisma.availableDate.findUnique({
      where: { id }
    })

    if (!existingDate) {
      return NextResponse.json({ error: 'Available date not found' }, { status: 404 })
    }

    if (existingDate.isBooked) {
      return NextResponse.json({ error: 'Cannot update a booked date' }, { status: 400 })
    }

    // Calculate new timeSlot if startTime or endTime is being updated
    const newStartTime = startTime || existingDate.startTime
    const newEndTime = endTime || existingDate.endTime
    const newTimeSlot = `${newStartTime} - ${newEndTime}`

    const updatedDate = await prisma.availableDate.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        timeSlot: newTimeSlot,
        ...(isRecurring !== undefined && { isRecurring }),
        ...(dayOfWeek !== undefined && { dayOfWeek })
      }
    })

    return NextResponse.json({
      message: 'Available date updated successfully',
      availableDate: {
        ...updatedDate,
        formattedDate: formatDateDMY(updatedDate.date),
        timeSlot: `${updatedDate.startTime} - ${updatedDate.endTime}`
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Error updating available date:', error)
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
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (!dateId && !deleteAll) {
      return NextResponse.json({ error: 'Date ID is required or set deleteAll=true' }, { status: 400 })
    }

    if (deleteAll) {
      // Delete all unbooked dates
      const deletedCount = await prisma.availableDate.deleteMany({
        where: { isBooked: false }
      })

      return NextResponse.json({ 
        message: `Deleted ${deletedCount.count} unbooked available dates`,
        deletedCount: deletedCount.count
      })
    }

    // Check if the date is booked
    const availableDate = await prisma.availableDate.findUnique({
      where: { id: dateId! }
    })

    if (!availableDate) {
      return NextResponse.json({ error: 'Available date not found' }, { status: 404 })
    }

    if (availableDate.isBooked) {
      return NextResponse.json({ error: 'Cannot delete a booked date' }, { status: 400 })
    }

    await prisma.availableDate.delete({
      where: { id: dateId! }
    })

    return NextResponse.json({ message: 'Available date deleted successfully' })
  } catch (error) {
    console.error('Error deleting available date:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}