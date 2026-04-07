import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/actions/auth';
import { prisma } from '@/lib/prisma';
import { audit } from '@/lib/audit';
import { cacheManager, CacheTags } from '@/lib/cache-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: { id, teacherId: session.user.id },
      include: { class: true, grades: { include: { class: true } } },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found', data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: student, error: null });
  } catch (error) {
    console.error('[API] Student GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: null },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, status } = body;

    const existing = await prisma.student.findFirst({
      where: { id, teacherId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Student not found', data: null },
        { status: 404 }
      );
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(status && { status: String(status) }),
      },
      include: { class: true },
    });

    cacheManager.deleteByTag(CacheTags.STUDENTS);
    audit.logUpdate('student', student.id, { name: existing.name }, { name: student.name });

    return NextResponse.json({ success: true, data: student, error: null });
  } catch (error) {
    console.error('[API] Student PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update student', data: null },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.student.findFirst({
      where: { id, teacherId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Student not found', data: null },
        { status: 404 }
      );
    }

    await prisma.student.delete({ where: { id } });

    cacheManager.deleteByTag(CacheTags.STUDENTS);
    audit.logDelete('student', id, { name: existing.name });

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (error) {
    console.error('[API] Student DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete student', data: null },
      { status: 500 }
    );
  }
}