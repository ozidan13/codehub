import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const topUpSchema = z.object({
  amount: z.number().min(10).max(1000)
})

// GET /api/wallet - Get user wallet balance
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ balance: user.balance })
  } catch (error) {
    console.error('Error fetching wallet balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/wallet - Request wallet top-up
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount } = topUpSchema.parse(body)

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'TOP_UP',
        amount: amount.toString(),
        status: 'PENDING',
        description: `Wallet top-up request for $${amount}`
      }
    })

    return NextResponse.json({ 
      message: 'Top-up request submitted successfully',
      transactionId: transaction.id
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    console.error('Error creating top-up request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}