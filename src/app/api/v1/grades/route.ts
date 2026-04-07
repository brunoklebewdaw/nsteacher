import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';
import { getPagination, createPaginatedResponse } from '@/lib/api-utils';
import { audit } from '@/lib/audit';
import { cacheManager, CacheTags } from '@/lib/cache-manager';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const { page, limit } = getPagination(request.nextUrl.searchParams);
    const studentId = request.nextUrl.searchParams.get('studentId');
    const classId = request.nextUrl.searchParams.get('classId');
    const subject = request.nextUrl.searchParams.get('subject');
    const skip = (page - 1) * limit;

    const where: any = { teacherId: session.user.id };
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;
    if (subject) where.subject = subject;

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        include: { student: true, class: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.grade.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: grades,
      pagination: createPaginatedResponse(grades, total, page, limit).pagination,
    });
  } catch (error) {
    console.error('[API] Grades GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: null },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentId, classId, subject, assessmentName, assessmentType, weight, value, date } = body;

    if (!studentId || !classId || !subject || !assessmentName || value === undefined || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields', data: null },
        { status: 400 }
      );
    }

    const grade = await prisma.grade.create({
      data: {
        teacherId: session.user.id,
        studentId: String(studentId),
        classId: String(classId),
        subject: String(subject),
        assessmentName: String(assessmentName),
        assessmentType: assessmentType || 'nota',
        weight: weight ? parseFloat(weight) : 1.0,
        value: parseFloat(value),
        date: new Date(date),
      },
      include: { student: true, class: true },
    });

    cacheManager.deleteByTag(CacheTags.GRADES);
    cacheManager.deleteByTag(CacheTags.REPORTS);
    audit.logCreate('grade', grade.id, { studentId, subject, value });

    return NextResponse.json({ success: true, data: grade, error: null }, { status: 201 });
  } catch (error) {
    console.error('[API] Grades POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create grade', data: null },
      { status: 500 }
    );
  }
}