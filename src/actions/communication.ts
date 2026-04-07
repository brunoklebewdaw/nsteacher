'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createPostSchema, sendMessageSchema } from '@/lib/schemas';

async function requireTeacher() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'teacher') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

// ==================== MURAL DE AVISOS ====================

export async function getPosts(classId?: string) {
  const user = await requireTeacher();
  
  const userClasses = await prisma.class.findMany({
    where: { teacherId: user.id },
    select: { id: true }
  });
  const classIds = userClasses.map(c => c.id);
  
  const where: any = { 
    OR: [
      { authorId: user.id },
      { classId: { in: classIds } }
    ]
  };
  
  if (classId) {
    where.AND = [{ classId }];
  }

  return prisma.post.findMany({
    where,
    include: { 
      author: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } }
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createPost(formData: FormData) {
  const user = await requireTeacher();
  
  try {
    const data = {
      classId: formData.get('classId') as string || null,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      isPinned: formData.get('isPinned') === 'true',
      attachments: formData.get('attachments') as string || null,
    };
    
    const validated = createPostSchema.parse(data);
    
    await prisma.post.create({
      data: {
        ...validated,
        authorId: user.id,
        classId: validated.classId || null,
        attachments: validated.attachments || null,
      }
    });
    
    revalidatePath('/teacher/communications');
    revalidatePath('/teacher');
  } catch (err: any) {
    return { error: err.message || 'Erro ao criar publicação' };
  }
}

export async function updatePost(id: string, formData: FormData) {
  const user = await requireTeacher();
  
  try {
    await prisma.post.update({
      where: { id, authorId: user.id },
      data: {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        isPinned: formData.get('isPinned') === 'true',
      }
    });
    
    revalidatePath('/teacher/communications');
  } catch (err) {
    return { error: 'Erro ao atualizar publicação' };
  }
}

export async function deletePost(id: string) {
  const user = await requireTeacher();
  
  try {
    await prisma.post.delete({
      where: { id, authorId: user.id }
    });
    
    revalidatePath('/teacher/communications');
  } catch (err) {
    return { error: 'Erro ao excluir publicação' };
  }
}

export async function archivePost(id: string) {
  const user = await requireTeacher();
  
  try {
    await prisma.post.update({
      where: { id, authorId: user.id },
      data: { isArchived: true }
    });
    
    revalidatePath('/teacher/communications');
  } catch (err) {
    return { error: 'Erro ao arquivar publicação' };
  }
}

export async function incrementPostViews(id: string) {
  await prisma.post.update({
    where: { id },
    data: { viewCount: { increment: 1 } }
  });
}

// ==================== CHAT ====================

export async function getConversations() {
  const user = await requireTeacher();
  const userId = user.id;
  
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ fromId: userId }, { toId: userId }]
    },
    include: {
      from: { select: { id: true, name: true, role: true } },
      to: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  const conversationsMap = new Map();
  
  messages.forEach(msg => {
    const otherId = msg.fromId === userId ? msg.toId : msg.fromId;
    const otherName = msg.fromId === userId ? msg.to.name : msg.from.name;
    const otherRole = msg.fromId === userId ? msg.to.role : msg.from.role;
    
    if (!conversationsMap.has(otherId)) {
      conversationsMap.set(otherId, {
        userId: otherId,
        userName: otherName,
        userRole: otherRole,
        lastMessage: msg,
        unread: msg.toId === userId && !msg.readAt ? 1 : 0
      });
    } else {
      const conv = conversationsMap.get(otherId);
      if (msg.toId === userId && !msg.readAt) {
        conv.unread++;
      }
    }
  });
  
  return Array.from(conversationsMap.values()).sort((a, b) => 
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );
}

export async function getMessagesWithUser(otherUserId: string) {
  const user = await requireTeacher();
  
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { fromId: user.id, toId: otherUserId },
        { fromId: otherUserId, toId: user.id }
      ]
    },
    include: {
      from: { select: { id: true, name: true, role: true } },
      to: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  await prisma.message.updateMany({
    where: { fromId: otherUserId, toId: user.id, readAt: null },
    data: { readAt: new Date() }
  });
  
  return messages;
}

export async function sendMessage(formData: FormData) {
  const user = await requireTeacher();
  
  try {
    const data = {
      toId: formData.get('toId') as string,
      content: formData.get('content') as string,
      type: formData.get('type') as string || 'direct',
    };
    
    const validated = sendMessageSchema.parse(data);
    
    const message = await prisma.message.create({
      data: {
        fromId: user.id,
        toId: validated.toId,
        content: validated.content,
        type: validated.type
      }
    });
    
    await createNotification(validated.toId, 'Nova mensagem', `${user.name} enviou uma mensagem`, 'info', '/teacher/communications');
    
    revalidatePath('/teacher/communications');
    return message;
  } catch (err: any) {
    return { error: err.message || 'Erro ao enviar mensagem' };
  }
}

export async function getUnreadCount() {
  const user = await requireTeacher();
  
  const count = await prisma.message.count({
    where: { toId: user.id, readAt: null }
  });
  
  return count;
}

// ==================== NOTIFICAÇÕES ====================

export async function getNotifications(unreadOnly = false) {
  const user = await requireTeacher();
  
  const where: any = { userId: user.id };
  if (unreadOnly) {
    where.isRead = false;
  }
  
  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function getUnreadNotificationCount() {
  const user = await requireTeacher();
  
  return prisma.notification.count({
    where: { userId: user.id, isRead: false }
  });
}

export async function createNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: 'info' | 'warning' | 'alert' | 'success' = 'info',
  link?: string
) {
  return prisma.notification.create({
    data: { userId, title, message, type, link }
  });
}

export async function markNotificationRead(id: string) {
  const user = await requireTeacher();
  
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true }
  });
  
  revalidatePath('/teacher');
}

export async function markAllNotificationsRead() {
  const user = await requireTeacher();
  
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true }
  });
  
  revalidatePath('/teacher');
}

export async function deleteNotification(id: string) {
  const user = await requireTeacher();
  
  await prisma.notification.delete({
    where: { id, userId: user.id }
  });
  
  revalidatePath('/teacher');
}

// ==================== CONTATOS (Alunos para chat) ====================

export async function getChatContacts() {
  const user = await requireTeacher();
  
  const students = await prisma.student.findMany({
    where: { teacherId: user.id },
    select: { 
      id: true, 
      name: true, 
      classId: true,
      class: { select: { name: true, id: true } }
    }
  });
  
  return students.map(s => ({
    id: s.id,
    name: s.name,
    role: 'student',
    class: s.class?.name
  }));
}

// ==================== ESCOLAS ====================

export async function getSchools() {
  return prisma.school.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function getSchoolById(id: string) {
  return prisma.school.findUnique({
    where: { id },
    include: { 
      users: { select: { id: true, name: true, role: true } },
      classes: { select: { id: true, name: true, year: true } }
    }
  });
}

export async function createSchool(formData: FormData) {
  const session = await getSession();
  if (session?.user?.role !== 'admin') {
    throw new Error('Apenas administradores podem criar escolas');
  }
  
  try {
    await prisma.school.create({
      data: {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        cnpj: formData.get('cnpj') as string || null,
        address: formData.get('address') as string || null,
        phone: formData.get('phone') as string || null,
      }
    });
    
    revalidatePath('/admin');
  } catch (err) {
    return { error: 'Erro ao criar escola' };
  }
}