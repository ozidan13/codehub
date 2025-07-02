import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role, SubmissionStatus } from '@prisma/client'

export async function GET() {
  try {
    const totalStudents = await prisma.user.count({
      where: { role: Role.STUDENT },
    })

    const totalUsers = await prisma.user.count()

    const totalPlatforms = await prisma.platform.count()

    const totalSubmissions = await prisma.submission.count()

    const pendingSubmissions = await prisma.submission.count({
      where: { status: SubmissionStatus.PENDING },
    })

    const approvedSubmissions = await prisma.submission.count({
      where: { status: SubmissionStatus.APPROVED },
    })

    const rejectedSubmissions = await prisma.submission.count({
      where: { status: SubmissionStatus.REJECTED },
    })

    const averageScoreResult = await prisma.submission.aggregate({
      _avg: {
        score: true,
      },
      where: { status: SubmissionStatus.APPROVED, score: { not: null } },
    })

    const averageScore = averageScoreResult._avg.score || 0

    return NextResponse.json({
      totalStudents,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      averageScore,
      totalUsers,
      totalPlatforms,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
