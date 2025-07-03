import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['STUDENT', 'ADMIN']).optional()
})

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'ADMIN']).default('STUDENT')
})

// GET /api/users - Get all users with their progress (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const includeProgress = searchParams.get('includeProgress') === 'true'

    let whereClause: any = {}
    if (role) {
      whereClause.role = role
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        ...(includeProgress && {
          submissions: {
            select: {
              status: true,
              score: true
            },
            orderBy: { createdAt: 'desc' }
          }
        })
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate progress statistics for each user if requested
    const usersWithStats = includeProgress ? users.map((user: any) => {
      if (!user.submissions) return user
      
      const totalSubmissions = user.submissions.length
      const approvedSubmissions = user.submissions.filter((s: any) => s.status === 'APPROVED').length
      const pendingSubmissions = user.submissions.filter((s: any) => s.status === 'PENDING').length
      const rejectedSubmissions = user.submissions.filter((s: any) => s.status === 'REJECTED').length
      
      const scores = user.submissions
        .filter((s: any) => s.score !== null)
        .map((s: any) => s.score!)
      
      const averageScore = scores.length > 0 
        ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length 
        : null

      return {
        ...user,
        stats: {
          totalSubmissions,
          approvedSubmissions,
          pendingSubmissions,
          rejectedSubmissions,
          averageScore: averageScore ? Math.round(averageScore * 100) / 100 : null
        }
      }
    }) : users

    return NextResponse.json({ users: usersWithStats })

  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users - Update user (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updateData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from changing their own role
    if (userId === session.user.id && updateData.role && updateData.role !== existingUser.role) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ user })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}