import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  try {
    const totalSubmissions = await prisma.submission.count({
      where: { userId },
    });

    const pendingSubmissions = await prisma.submission.count({
      where: { userId, status: SubmissionStatus.PENDING },
    });

    const approvedSubmissions = await prisma.submission.count({
      where: { userId, status: SubmissionStatus.APPROVED },
    });

    const rejectedSubmissions = await prisma.submission.count({
      where: { userId, status: SubmissionStatus.REJECTED },
    });

    const averageScoreResult = await prisma.submission.aggregate({
      _avg: {
        score: true,
      },
      where: { userId, status: SubmissionStatus.APPROVED, score: { not: null } },
    });

    const averageScore = averageScoreResult._avg.score || 0;

    return NextResponse.json({
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      averageScore,
    });
  } catch (error) {
    console.error('Error fetching student dashboard stats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
