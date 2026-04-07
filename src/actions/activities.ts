'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

async function requireTeacher() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'teacher') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function getActivities(subject?: string, classId?: string, type?: string) {
  const user = await requireTeacher();
  
  const where: any = { teacherId: user.id, isActive: true };
  if (subject) where.subject = subject;
  if (classId) where.classId = classId;
  if (type) where.activityType = type;

  return await prisma.activityBank.findMany({
    where,
    include: { class: true },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function createActivity(formData: FormData) {
  const user = await requireTeacher();

  try {
    const classId = formData.get('classId') as string || null;
    const subject = formData.get('subject') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || null;
    const activityType = formData.get('activityType') as string;
    const difficulty = formData.get('difficulty') as string || 'medio';
    const content = formData.get('content') as string || null;
    const answer = formData.get('answer') as string || null;
    const tags = formData.get('tags') as string || null;

    await prisma.activityBank.create({
      data: {
        teacherId: user.id,
        classId,
        subject,
        title,
        description,
        activityType,
        difficulty,
        content,
        answer,
        tags
      }
    });
    revalidatePath('/teacher/activities');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao criar atividade' };
  }
}

export async function updateActivity(id: string, formData: FormData) {
  const user = await requireTeacher();

  try {
    const classId = formData.get('classId') as string || null;
    const subject = formData.get('subject') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || null;
    const activityType = formData.get('activityType') as string;
    const difficulty = formData.get('difficulty') as string;
    const content = formData.get('content') as string || null;
    const answer = formData.get('answer') as string || null;
    const tags = formData.get('tags') as string || null;

    await prisma.activityBank.update({
      where: { id, teacherId: user.id },
      data: {
        classId,
        subject,
        title,
        description,
        activityType,
        difficulty,
        content,
        answer,
        tags
      }
    });
    revalidatePath('/teacher/activities');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao atualizar atividade' };
  }
}

export async function deleteActivity(id: string) {
  const user = await requireTeacher();

  try {
    await prisma.activityBank.update({
      where: { id, teacherId: user.id },
      data: { isActive: false }
    });
    revalidatePath('/teacher/activities');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao excluir atividade' };
  }
}

export async function duplicateActivity(id: string) {
  const user = await requireTeacher();

  try {
    const original = await prisma.activityBank.findFirst({
      where: { id, teacherId: user.id }
    });

    if (!original) {
      return { error: 'Atividade não encontrada' };
    }

    await prisma.activityBank.create({
      data: {
        teacherId: user.id,
        classId: original.classId,
        subject: original.subject,
        title: `${original.title} (cópia)`,
        description: original.description,
        activityType: original.activityType,
        difficulty: original.difficulty,
        content: original.content,
        answer: original.answer,
        tags: original.tags
      }
    });
    revalidatePath('/teacher/activities');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao duplicar atividade' };
  }
}

export async function getActivityById(id: string) {
  const user = await requireTeacher();

  return await prisma.activityBank.findFirst({
    where: { id, teacherId: user.id },
    include: { class: true }
  });
}

export async function assignActivityToClass(activityId: string, classId: string) {
  const user = await requireTeacher();

  try {
    const activity = await prisma.activityBank.findFirst({
      where: { id: activityId, teacherId: user.id }
    });

    if (!activity) {
      return { error: 'Atividade não encontrada' };
    }

    await prisma.activityBank.create({
      data: {
        teacherId: user.id,
        classId,
        subject: activity.subject,
        title: activity.title,
        description: activity.description,
        activityType: activity.activityType,
        difficulty: activity.difficulty,
        content: activity.content,
        answer: activity.answer,
        tags: activity.tags
      }
    });
    revalidatePath('/teacher/activities');
    return { success: true };
  } catch (err) {
    return { error: 'Erro ao atribuir atividade' };
  }
}