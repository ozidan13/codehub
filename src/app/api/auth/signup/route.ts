import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phoneNumber } = signupSchema.parse(body)

    // Check if user already exists with email or phone number
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phoneNumber }
        ]
      }
    })

    if (existingUser) {
      const errorMessage = existingUser.email === email 
        ? 'User already exists with this email'
        : 'User already exists with this phone number'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with starting balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with 500 EGP starting balance
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phoneNumber,
          role: 'STUDENT', // Default role
          balance: 1000.00 // Starting balance of 1000 EGP
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          balance: true,
          createdAt: true
        }
      })

      // Create initial transaction record for the starting balance
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'TOP_UP',
          amount: 500.00,
          status: 'APPROVED',
          description: 'Welcome bonus - Starting balance',
          adminWalletNumber: '01026454497'
        }
      })

      return user
    })

    const user = result

    // Optionally create user in Supabase Auth (if needed for additional features)
    // const { data: authUser, error: authError } = await supabase.auth.signUp({
    //   email,
    //   password,
    //   options: {
    //     data: {
    //       name,
    //       role: 'STUDENT'
    //     }
    //   }
    // })

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user 
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}