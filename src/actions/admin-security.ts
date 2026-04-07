'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
}

export async function getSecurityDashboard() {
  await requireAdmin();
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalLogins24h,
    failedLogins24h,
    activeUsers,
    securityAlerts,
    blockedIPs,
    recentAlerts
  ] = await Promise.all([
    prisma.loginHistory.count({
      where: { createdAt: { gte: last24h }, success: true }
    }),
    prisma.loginHistory.count({
      where: { createdAt: { gte: last24h }, success: false }
    }),
    prisma.user.count({
      where: { role: 'teacher', lastAccess: { gte: last24h } }
    }),
    prisma.securityAlert.count({
      where: { isRead: false, createdAt: { gte: last7d } }
    }),
    prisma.ipBlacklist.count({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
    }),
    prisma.securityAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  ]);

  return {
    totalLogins24h,
    failedLogins24h,
    activeUsers,
    securityAlerts,
    blockedIPs,
    recentAlerts
  };
}

export async function getLoginHistory(userId?: string, limit = 50) {
  await requireAdmin();
  
  const where: any = {};
  if (userId) where.userId = userId;

  const history = await prisma.loginHistory.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return history;
}

export async function getSecurityAlerts(unreadOnly = false) {
  await requireAdmin();
  
  const where: any = {};
  if (unreadOnly) where.isRead = false;

  return await prisma.securityAlert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function markAlertRead(alertId: string) {
  await requireAdmin();
  
  await prisma.securityAlert.update({
    where: { id: alertId },
    data: { isRead: true }
  });
  
  revalidatePath('/admin');
}

export async function markAllAlertsRead() {
  await requireAdmin();
  
  await prisma.securityAlert.updateMany({
    where: { isRead: false },
    data: { isRead: true }
  });
  
  revalidatePath('/admin');
}

export async function blockIp(ipAddress: string, reason?: string, expiresInHours?: number) {
  await requireAdmin();
  
  const expiresAt = expiresInHours 
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    : null;

  await prisma.ipBlacklist.upsert({
    where: { ipAddress },
    create: {
      ipAddress,
      reason,
      expiresAt
    },
    update: {
      reason,
      expiresAt
    }
  });

  await prisma.securityAlert.create({
    data: {
      type: 'ip_blocked',
      title: 'IP Bloqueado',
      message: `IP ${ipAddress} foi bloqueado. ${reason || ''}`,
      severity: 'high',
      metadata: JSON.stringify({ ipAddress, reason, expiresAt })
    }
  });

  revalidatePath('/admin');
}

export async function unblockIp(ipAddress: string) {
  await requireAdmin();
  
  await prisma.ipBlacklist.delete({
    where: { ipAddress }
  });
  
  revalidatePath('/admin');
}

export async function getBlockedIPs() {
  await requireAdmin();
  
  const now = new Date();
  
  return await prisma.ipBlacklist.findMany({
    where: {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getActiveSessions() {
  await requireAdmin();
  
  const sessions = await prisma.user.findMany({
    where: {
      role: 'teacher',
      currentSessionId: { not: null },
      lastAccess: { gte: new Date(Date.now() - 60 * 60 * 1000) }
    },
    select: {
      id: true,
      name: true,
      email: true,
      lastAccess: true,
      currentSessionId: true
    },
    orderBy: { lastAccess: 'desc' }
  });

  return sessions;
}

export async function forceLogoutUser(userId: string) {
  await requireAdmin();
  
  await prisma.user.update({
    where: { id: userId },
    data: { currentSessionId: null }
  });
  
  await prisma.securityAlert.create({
    data: {
      userId,
      type: 'force_logout',
      title: 'Logout forçado',
      message: 'O administrador encerrou sua sessão',
      severity: 'medium'
    }
  });
  
  revalidatePath('/admin');
}

export async function getSystemStats() {
  await requireAdmin();
  
  const [
    totalTeachers,
    totalStudents,
    totalClasses,
    totalGrades,
    activeSubscriptions,
    expiredSubscriptions
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'teacher' } }),
    prisma.student.count(),
    prisma.class.count(),
    prisma.grade.count(),
    prisma.accessKey.count({ where: { status: 'used' } }),
    prisma.accessKey.count({ where: { status: 'used', expiresAt: { lt: new Date() } } })
  ]);

  return {
    totalTeachers,
    totalStudents,
    totalClasses,
    totalGrades,
    activeSubscriptions,
    expiredSubscriptions
  };
}
