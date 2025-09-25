import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/platforms - Get all platforms with their tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeTasks = searchParams.get('include_tasks') === 'true'

    const platforms = await prisma.platform.findMany({
      include: includeTasks ? {
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { submissions: { where: { userId: session.user.id } } }
            },
            submissions: {
              where: { userId: session.user.id },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                score: true,
                feedback: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        }
      } : undefined,
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ platforms })

  } catch (error) {
    console.error('Platforms fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/platforms - Create new platform (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { name, description, url, courseLink } = await request.json()

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      )
    }

    const platform = await prisma.platform.create({
      data: {
        name,
        description,
        url,
        courseLink
      }
    })

    return NextResponse.json({ platform }, { status: 201 })

  } catch (error) {
    console.error('Platform creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}