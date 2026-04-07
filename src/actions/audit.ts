'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';
import { headers } from 'next/headers';

async function requireTeacher() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'teacher') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function logAction(
  action: 'create' | 'update' | 'delete',
  entity: string,
  entityId: string,
  details?: Record<string, any>
) {
  try {
    const session = await getSession();
    if (!session?.user) return;

    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await prisma.auditLog.create({
      data: {
        teacherId: session.user.id,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent
      }
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

export async function getAuditLogs(entity?: string, entityId?: string, limit = 50) {
  const user = await requireTeacher();

  const where: any = { teacherId: user.id };
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;

  return await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function getRecentActivity(limit = 10) {
  const user = await requireTeacher();

  return await prisma.auditLog.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}