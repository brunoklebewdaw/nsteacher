import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as ics from 'ics';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const resolvedParams = await params;
  const teacherId = resolvedParams.teacherId;

  if (!teacherId) {
    return new NextResponse('Teacher ID is required', { status: 400 });
  }

  const lessons = await prisma.lesson.findMany({
    where: { teacherId },
    include: { class: true }
  });

  const events: ics.EventAttributes[] = lessons.map(lesson => {
    const date = new Date(lesson.date);
    return {
      title: `${lesson.subject} - ${lesson.class.name}`,
      description: `${lesson.theme}\n\n${lesson.content || ''}`,
      start: [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()],
      duration: { hours: 1 }, // Default 1 hour
      status: lesson.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE',
      busyStatus: 'BUSY',
    };
  });

  if (events.length === 0) {
    // Return empty calendar if no events
    const { error, value } = ics.createEvents([{
      title: 'NSteacher Calendar',
      start: [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate(), 0, 0],
      duration: { hours: 1 },
      description: 'Your NSteacher calendar is empty.'
    }]);
    
    if (error) {
      return new NextResponse('Error generating calendar', { status: 500 });
    }

    return new NextResponse(value, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="nsteacher-${teacherId}.ics"`,
      },
    });
  }

  const { error, value } = ics.createEvents(events);

  if (error) {
    return new NextResponse('Error generating calendar', { status: 500 });
  }

  return new NextResponse(value, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="nsteacher-${teacherId}.ics"`,
    },
  });
}
