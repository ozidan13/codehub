import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const approveTopUpSchema = z.object({
  transactionId: z.string(),
  action: z.enum(['APPROVE', 'REJECT'])
})

// Get all pending top-up requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const pendingTopUps = await prisma.transaction.findMany({
      where: {
        type: 'TOP_UP',
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ topUpRequests: pendingTopUps })
  } catch (error) {
    console.error('Get pending top-ups error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Approve or reject top-up request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { transactionId, action } = approveTopUpSchema.parse(body)

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Transaction already processed' },
        { status: 400 }
      )
    }

    if (action === 'APPROVE') {
      // Update transaction status and user balance in a transaction
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'APPROVED' }
        })

        // Add amount to user balance
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            balance: {
              increment: transaction.amount
            }
          }
        })
      })

      return NextResponse.json({
        message: 'Top-up request approved successfully',
        transaction: { ...transaction, status: 'APPROVED' }
      })
    } else {
      // Reject the transaction
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'REJECTED' }
      })

      return NextResponse.json({
        message: 'Top-up request rejected',
        transaction: updatedTransaction
      })
    }
  } catch (error) {
    console.error('Process top-up request error:', error)
    
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