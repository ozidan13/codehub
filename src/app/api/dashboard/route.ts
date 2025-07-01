import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role === 'STUDENT') {
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

    } else if (session.user.role === 'ADMIN') {
      // Admin dashboard data
      const [totalUsers, totalStudents, totalSubmissions, pendingSubmissions, platforms, recentSubmissions] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.submission.count(),
        prisma.submission.count({ where: { status: 'PENDING' } }),
        prisma.platform.count(),
        prisma.submission.findMany({
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
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
        })
      ])

      // Get platform-wise submission statistics
      const platformStats = await prisma.platform.findMany({
        include: {
          tasks: {
            include: {
              submissions: {
                select: {
                  id: true,
                  status: true,
                  score: true
                }
              }
            }
          }
        }
      })

      const platformStatistics = platformStats.map(platform => {
        const allSubmissions = platform.tasks.flatMap(task => task.submissions)
        const totalSubmissions = allSubmissions.length
        const approvedSubmissions = allSubmissions.filter(s => s.status === 'APPROVED').length
        const pendingSubmissions = allSubmissions.filter(s => s.status === 'PENDING').length
        
        const scores = allSubmissions
          .filter(s => s.score !== null)
          .map(s => s.score!)
        
        const averageScore = scores.length > 0 
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
          : null

        return {
          platformId: platform.id,
          platformName: platform.name,
          totalTasks: platform.tasks.length,
          totalSubmissions,
          approvedSubmissions,
          pendingSubmissions,
          averageScore: averageScore ? Math.round(averageScore * 100) / 100 : null
        }
      })

      return NextResponse.json({
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role
        },
        stats: {
          totalUsers,
          totalStudents,
          totalSubmissions,
          pendingSubmissions,
          totalPlatforms: platforms
        },
        platformStatistics,
        recentSubmissions
      })
    }

    return NextResponse.json(
      { error: 'Invalid user role' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}