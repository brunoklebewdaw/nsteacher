import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';
import { getPagination, createPaginatedResponse } from '@/lib/api-utils';
import { audit } from '@/lib/audit';
import { cacheManager, cacheKey, CacheTags } from '@/lib/cache-manager';

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
    const classId = request.nextUrl.searchParams.get('classId');
    const status = request.nextUrl.searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: any = { teacherId: session.user.id };
    if (classId) where.classId = classId;
    if (status) where.status = status;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { class: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: createPaginatedResponse(students, total, page, limit).pagination,
    });
  } catch (error) {
    console.error('[API] Students GET error:', error);
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
    const { name, classId } = body;

    if (!name || !classId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, classId', data: null },
        { status: 400 }
      );
    }

    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId: session.user.id },
    });

    if (!cls) {
      return NextResponse.json(
        { success: false, error: 'Class not found or unauthorized', data: null },
        { status: 404 }
      );
    }

    const student = await prisma.student.create({
      data: {
        teacherId: session.user.id,
        classId: String(classId),
        name: String(name).trim(),
      },
      include: { class: true },
    });

    cacheManager.deleteByTag(CacheTags.STUDENTS);
    audit.logCreate('student', student.id, { name, classId });

    return NextResponse.json({ success: true, data: student, error: null }, { status: 201 });
  } catch (error) {
    console.error('[API] Students POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create student', data: null },
      { status: 500 }
    );
  }
}