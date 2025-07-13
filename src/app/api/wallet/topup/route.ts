import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const topUpSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1 EGP'),
  senderWalletNumber: z.string().min(1, 'Sender wallet number is required')
})

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
    const validatedData = topUpSchema.parse(body)

    // Create a pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'TOP_UP',
        amount: validatedData.amount,
        status: 'PENDING',
        description: `Balance top-up request - ${validatedData.amount} EGP`,
        senderWalletNumber: validatedData.senderWalletNumber,
        adminWalletNumber: '01026454497'
      }
    })

    return NextResponse.json({
      message: 'Top-up request submitted successfully',
      transaction
    })
  } catch (error) {
    console.error('Top-up request error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user's top-up requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: 'TOP_UP'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Get top-up requests error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}