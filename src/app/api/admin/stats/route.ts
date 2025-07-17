import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role, SubmissionStatus, SessionType, BookingStatus } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const [
      totalStudents,
      totalUsers,
      totalPlatforms,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      averageScoreResult,
      totalMentorshipBookings,
      recordedSessions,
      faceToFaceSessions,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count(),
      prisma.platform.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { status: SubmissionStatus.PENDING } }),
      prisma.submission.count({ where: { status: SubmissionStatus.APPROVED } }),
      prisma.submission.count({ where: { status: SubmissionStatus.REJECTED } }),
      prisma.submission.aggregate({
        _avg: {
          score: true,
        },
        where: { status: SubmissionStatus.APPROVED, score: { not: null } },
      }),
      // Mentorship statistics
      prisma.mentorshipBooking.count(),
      prisma.mentorshipBooking.count({ where: { sessionType: SessionType.RECORDED } }),
      prisma.mentorshipBooking.count({ where: { sessionType: SessionType.FACE_TO_FACE } }),
      prisma.mentorshipBooking.count({ where: { status: BookingStatus.PENDING } }),
      prisma.mentorshipBooking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.mentorshipBooking.count({ where: { status: BookingStatus.COMPLETED } }),
      prisma.mentorshipBooking.count({ where: { status: BookingStatus.CANCELLED } }),
    ])

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
      // Mentorship statistics
      totalMentorshipBookings,
      recordedSessions,
      faceToFaceSessions,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}