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
    const skip = (page - 1) * limit;

    const cacheKeyValue = cacheKey([session.user.id, 'classes', String(page), String(limit), classId || 'all']);
    const cached = cacheManager.get<any>(cacheKeyValue);
    if (cached) {
      return NextResponse.json({ success: true, data: cached.data, pagination: cached.pagination });
    }

    const where: any = { teacherId: session.user.id };
    if (classId) where.id = classId;

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          _count: { select: { students: true, lessons: true, grades: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.class.count({ where }),
    ]);

    const response = createPaginatedResponse(classes, total, page, limit);
    cacheManager.set(cacheKeyValue, response, { ttl: 120, tags: [CacheTags.CLASSES] });

    return NextResponse.json({ success: true, data: response.data, pagination: response.pagination });
  } catch (error) {
    console.error('[API] Classes GET error:', error);
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
    const { name, school, year, level } = body;

    if (!name || !school || !year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, school, year', data: null },
        { status: 400 }
      );
    }

    const cls = await prisma.class.create({
      data: {
        teacher: { connect: { id: session.user.id } },
        name: String(name).trim(),
        school: { connect: { id: String(school).trim() } },
        year: parseInt(year),
        level: level || null,
      },
      include: {
        _count: { select: { students: true } }
      }
    });

    cacheManager.deleteByTag(CacheTags.CLASSES);
    audit.logCreate('class', cls.id, { name, school, year });

    return NextResponse.json(
      { success: true, data: cls, error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Classes POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create class', data: null },
      { status: 500 }
    );
  }
}