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
    const [
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      averageScoreResult,
    ] = await prisma.$transaction([
      prisma.submission.count({ where: { userId } }),
      prisma.submission.count({ where: { userId, status: SubmissionStatus.PENDING } }),
      prisma.submission.count({ where: { userId, status: SubmissionStatus.APPROVED } }),
      prisma.submission.count({ where: { userId, status: SubmissionStatus.REJECTED } }),
      prisma.submission.aggregate({
        _avg: { score: true },
        where: { userId, status: SubmissionStatus.APPROVED, score: { not: null } },
      }),
    ]);

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
