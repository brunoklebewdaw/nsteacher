'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getSession } from './auth';
import { headers } from 'next/headers';
import { createAccessKey, renewAccessKey, deleteAccessKey } from './admin-keys';

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
}

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-forwarded-for')?.split(',')[0] || 
         headersList.get('x-real-ip') || 
         'unknown';
}

async function logAdminAction(
  action: string,
  entity: string,
  entityId: string,
  details?: string
) {
  const session = await getSession();
  if (!session?.user) return;
  
  const adminId = session.user.id === 'admin' ? null : session.user.id;
  
  await prisma.auditLog.create({
    data: {
      teacherId: adminId,
      action: action as any,
      entity,
      entityId,
      description: details,
      ipAddress: await getClientIp()
    }
  });
}

export async function getTeachers() {
  await requireAdmin();
  return await prisma.user.findMany({ where: { role: 'teacher' }, orderBy: { createdAt: 'desc' } });
}

export async function createTeacher(formData: FormData) {
  await requireAdmin();
  
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const school = formData.get('school') as string;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const data: any = {
      role: 'teacher',
      name,
      email,
      password: hashedPassword,
      paymentStatus: 'active',
      active: true
    };
    
    if (school) {
      data.school = { connect: { id: school } };
    }
    
    const user = await prisma.user.create({ data });
    await logAdminAction('create', 'user', user.id, `Criou professor: ${email}`);
    revalidatePath('/admin/teachers');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao criar professor. Email pode já estar em uso.' };
  }
}

export async function togglePaymentStatus(id: string, currentStatus: string) {
  await requireAdmin();
  
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: 'Usuário não encontrado' };
  
  const newStatus = currentStatus === 'active' ? 'inadimplente' : 'active';
  await prisma.user.update({
    where: { id },
    data: { paymentStatus: newStatus }
  });
  
  await logAdminAction('update', 'user', id, `Alterou status de pagamento: ${user.email} - ${newStatus}`);
  revalidatePath('/admin/teachers');
}

export async function toggleBlocked(id: string, currentBlocked: boolean) {
  await requireAdmin();
  
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: 'Usuário não encontrado' };
  
  const newBlocked = !currentBlocked;
  await prisma.user.update({
    where: { id },
    data: { blocked: newBlocked }
  });
  
  await logAdminAction('update', 'user', id, `Alterou bloqueio: ${user.email} - ${newBlocked ? 'bloqueado' : 'desbloqueado'}`);
  revalidatePath('/admin/teachers');
}

export async function toggleActive(id: string) {
  await requireAdmin();
  
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: 'Usuário não encontrado' };
  
  const newActive = !user.active;
  await prisma.user.update({
    where: { id },
    data: { active: newActive }
  });
  
  await logAdminAction('update', 'user', id, `Alterou ativação: ${user.email} - ${newActive ? 'ativado' : 'desativado'}`);
  revalidatePath('/admin/teachers');
}

export async function deleteTeacher(id: string) {
  await requireAdmin();
  
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: 'Usuário não encontrado' };
  
  await prisma.user.delete({ where: { id } });
  await logAdminAction('delete', 'user', id, `Excluiu professor: ${user.email}`);
  revalidatePath('/admin/teachers');
}

export async function getSchools() {
  await requireAdmin();
  return await prisma.school.findMany({
    include: {
      _count: { select: { users: true, classes: true } }
    },
    orderBy: { name: 'asc' }
  });
}

export async function createSchool(formData: FormData) {
  await requireAdmin();
  
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const cnpj = formData.get('cnpj') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;

  try {
    const school = await prisma.school.create({
      data: { name, slug, cnpj, address, phone }
    });
    await logAdminAction('create', 'school', school.id, `Criou escola: ${name}`);
    revalidatePath('/admin/schools');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao criar escola. Slug pode já existir.' };
  }
}

export async function updateSchool(id: string, formData: FormData) {
  await requireAdmin();
  
  const name = formData.get('name') as string;
  const cnpj = formData.get('cnpj') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;

  await prisma.school.update({
    where: { id },
    data: { name, cnpj, address, phone }
  });
  
  await logAdminAction('update', 'school', id, `Atualizou escola: ${name}`);
  revalidatePath('/admin/schools');
}

export async function deleteSchool(id: string) {
  await requireAdmin();
  
  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) return { error: 'Escola não encontrada' };
  
  await prisma.school.delete({ where: { id } });
  await logAdminAction('delete', 'school', id, `Excluiu escola: ${school.name}`);
  revalidatePath('/admin/schools');
}

export async function getAccessKeysStats() {
  await requireAdmin();
  const now = new Date();
  
  const [total, active, expired, revenue] = await Promise.all([
    prisma.accessKey.count(),
    prisma.accessKey.count({ where: { status: 'used', expiresAt: { gt: now } } }),
    prisma.accessKey.count({ where: { status: 'used', expiresAt: { lt: now } } }),
    prisma.accessKey.aggregate({
      _sum: { price: true },
      where: { status: 'used' }
    })
  ]);

  return { total, active, expired, revenue: revenue._sum.price || 0 };
}

export async function getAccessKeys() {
  await requireAdmin();
  return await prisma.accessKey.findMany({
    include: { teacher: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createAdminAccessKey(formData: FormData) {
  await requireAdmin();
  
  const planType = formData.get('planType') as string;
  const emailTarget = (formData.get('emailTarget') as string)?.toLowerCase().trim() || null;
  
  const plans: Record<string, { price: number; days: number }> = {
    test: { price: 0, days: 0.167 },
    monthly: { price: 19.99, days: 30 },
    yearly: { price: 179.88, days: 365 }
  };

  const plan = plans[planType] || plans.monthly;
  
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 12; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (plan.days * 24));

  await prisma.accessKey.create({
    data: { key, planType, price: plan.price, status: 'active', expiresAt, emailTarget }
  });
  
  await logAdminAction('create', 'accessKey', key, `Criou chave: ${planType}${emailTarget ? ` para ${emailTarget}` : ''}`);
  revalidatePath('/admin/keys');
  return { success: true, key };
}

export async function deleteAdminAccessKey(id: string) {
  await requireAdmin();
  
  await prisma.accessKey.delete({ where: { id } });
  await logAdminAction('delete', 'accessKey', id, `Excluiu chave de acesso`);
  revalidatePath('/admin/keys');
}

export async function assignKeyToTeacher(keyId: string, teacherId: string) {
  await requireAdmin();
  
  await prisma.accessKey.update({
    where: { id: keyId },
    data: { teacherId, status: 'used', usedAt: new Date() }
  });
  
  await prisma.user.update({
    where: { id: teacherId },
    data: { paymentStatus: 'active', blocked: false }
  });
  
  await logAdminAction('update', 'accessKey', keyId, `Vinculou chave ao professor: ${teacherId}`);
  revalidatePath('/admin/keys');
}

export async function sendBulkEmail(formData: FormData) {
  await requireAdmin();
  
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;
  const recipientType = formData.get('recipientType') as string;

  let users;
  if (recipientType === 'all') {
    users = await prisma.user.findMany({ where: { role: 'teacher' }, select: { email: true } });
  } else if (recipientType === 'active') {
    users = await prisma.user.findMany({ where: { role: 'teacher', paymentStatus: 'active' }, select: { email: true } });
  } else if (recipientType === 'inadimplente') {
    users = await prisma.user.findMany({ where: { role: 'teacher', paymentStatus: 'inadimplente' }, select: { email: true } });
  }

  const emails = users?.map(u => u.email) || [];
  
  await prisma.notification.create({
    data: {
      type: 'bulk_email_queued',
      title: 'Email em massa enviado',
      message: `Enviado para ${emails.length} usuários: ${subject}`,
      userId: 'admin'
    }
  });

  return { success: true, count: emails.length };
}

export async function getAuditLogs(filters: { action?: string; entity?: string; startDate?: string; endDate?: string }, page = 1, limit = 50) {
  await requireAdmin();
  
  const where: any = {};
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createKeyForTeacher(teacherId: string, planType: string) {
  await requireAdmin();
  const formData = new FormData();
  formData.append('planType', planType);
  return createAccessKey(formData);
}

export async function renewKeyForTeacher(teacherId: string, daysInput: string) {
  const days = parseInt(daysInput) || 30;
  const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
  if (!teacher) return { error: 'Professor não encontrado' };
  
  const accessKey = await prisma.accessKey.findFirst({
    where: { teacherId, status: 'used' },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!accessKey) return { error: 'Chave não encontrada' };
  
  return renewAccessKey(accessKey.id, days);
}

export async function deleteKey(keyId: string) {
  await requireAdmin();
  return deleteAccessKey(keyId);
}

export async function createKey(formData: FormData) {
  return createAdminAccessKey(formData);
}

export async function deleteKeyById(id: string) {
  return deleteAdminAccessKey(id);
}
