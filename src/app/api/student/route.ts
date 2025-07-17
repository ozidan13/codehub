import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/student - Get student dashboard statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Student access required' },
        { status: 403 }
      )
    }

    // Student dashboard data
    const [submissions, totalTasks] = await Promise.all([
      prisma.submission.findMany({
        where: { userId: session.user.id },
        include: {
          task: {
            include: {
              platform: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.task.count()
    ])

    const totalSubmissions = submissions.length
    const approvedSubmissions = submissions.filter(s => s.status === 'APPROVED').length
    const pendingSubmissions = submissions.filter(s => s.status === 'PENDING').length
    const rejectedSubmissions = submissions.filter(s => s.status === 'REJECTED').length
    
    const scores = submissions
      .filter(s => s.score !== null)
      .map(s => s.score!)
    
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : null

    const completionRate = totalTasks > 0 ? (totalSubmissions / totalTasks) * 100 : 0

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      },
      stats: {
        totalTasks,
        totalSubmissions,
        approvedSubmissions,
        pendingSubmissions,
        rejectedSubmissions,
        averageScore: averageScore ? Math.round(averageScore * 100) / 100 : null,
        completionRate: Math.round(completionRate * 100) / 100
      },
      recentSubmissions: submissions.slice(0, 5)
    })

  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}