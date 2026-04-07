'use server';

import { prisma } from '@/lib/prisma';

interface Alert {
  title: string;
  message: string;
  type: string;
  link?: string;
}

export async function generateAlerts(teacherId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const teacherClasses = await prisma.class.findMany({
    where: { teacherId },
    include: { students: true, lessons: true, topics: true }
  });

  const teacherLessons = await prisma.lesson.findMany({
    where: { teacherId, date: { gte: today, lt: nextWeek } },
    orderBy: { date: 'asc' },
    include: { class: true }
  });

  const teacherGrades = await prisma.grade.findMany({
    where: { teacherId }
  });

  const teacherTopics = await prisma.curriculumTopic.findMany({
    where: { teacherId }
  });

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lessonsToday = teacherLessons.filter((l: any) => {
    const lessonDate = new Date(l.date);
    return lessonDate >= today && lessonDate < tomorrow;
  });

  const lessonsWithoutPlan = lessonsToday.filter((l: any) => !l.theme || !l.objective);

  if (lessonsWithoutPlan.length > 0) {
    alerts.push({
      title: 'Aula sem planejamento',
      message: `${lessonsWithoutPlan.length} aula(s) hoje sem tema ou objetivo definido`,
      type: 'warning',
      link: '/teacher/schedule'
    });
  }

  if (lessonsToday.length === 0) {
    alerts.push({
      title: 'Nenhuma aula hoje',
      message: 'Você não tem aulas agendadas para hoje',
      type: 'info',
      link: '/teacher/schedule'
    });
  }

  const gradesThisWeek = teacherGrades.filter((g: any) => {
    const gradeDate = new Date(g.date);
    return gradeDate >= yesterday && gradeDate <= today;
  });

  if (gradesThisWeek.length === 0 && teacherClasses.length > 0) {
    alerts.push({
      title: 'Notas não lançadas esta semana',
      message: 'Considere lançar notas para manter o acompanhamento em dia',
      type: 'warning',
      link: '/teacher/assessments'
    });
  }

  for (const cls of teacherClasses) {
    const classGrades = teacherGrades.filter((g: any) => g.classId === cls.id);
    if (classGrades.length > 0) {
      const avg = classGrades.reduce((sum: number, g: any) => sum + g.value, 0) / classGrades.length;
      if (avg < 5) {
        alerts.push({
          title: `Média baixa: ${cls.name}`,
          message: `A média da turma está em ${avg.toFixed(1)}`,
          type: 'alert',
          link: '/teacher/students'
        });
      }
    }

    const studentsAtRisk = cls.students.filter((s: any) => s.status === 'at-risk');
    if (studentsAtRisk.length > 0) {
      alerts.push({
        title: `Alunos em risco: ${cls.name}`,
        message: `${studentsAtRisk.length} aluno(s) com dificuldades`,
        type: 'alert',
        link: '/teacher/students'
      });
    }
  }

  const pendingTopics = teacherTopics.filter((t: any) => t.status === 'not-started');
  if (pendingTopics.length > teacherTopics.length * 0.7 && teacherTopics.length > 0) {
    alerts.push({
      title: 'Muitos tópicos pendentes',
      message: `${pendingTopics.length} de ${teacherTopics.length} tópicos BNCC não iniciados`,
      type: 'warning',
      link: '/teacher/planning'
    });
  }

  const upcomingLessons = teacherLessons.filter((l: any) => {
    const lessonDate = new Date(l.date);
    return lessonDate >= today && lessonDate < tomorrow;
  });

  if (upcomingLessons.length > 0) {
    alerts.push({
      title: 'Próximas aulas hoje',
      message: `${upcomingLessons.length} aula(s) agendada(s) para hoje`,
      type: 'success',
      link: '/teacher/schedule'
    });
  }

  return alerts;
}

export async function saveNotifications(teacherId: string, alerts: Array<{ title: string; message: string; type: string; link?: string }>) {
  for (const alert of alerts) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: teacherId,
        title: alert.title,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: teacherId,
          title: alert.title,
          message: alert.message,
          type: alert.type,
          link: alert.link || null
        }
      });
    }
  }
}

export async function getNotifications(teacherId: string, includeRead: boolean = false) {
  return prisma.notification.findMany({
    where: {
      userId: teacherId,
      ...(includeRead ? {} : { isRead: false })
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
}

export async function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
}

export async function markAllNotificationsRead(teacherId: string) {
  return prisma.notification.updateMany({
    where: { userId: teacherId, isRead: false },
    data: { isRead: true }
  });
}

export async function deleteOldNotifications(teacherId: string, daysOld: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return prisma.notification.deleteMany({
    where: {
      userId: teacherId,
      isRead: true,
      createdAt: { lt: cutoffDate }
    }
  });
}

export async function getUnreadCount(teacherId: string) {
  return prisma.notification.count({
    where: { userId: teacherId, isRead: false }
  });
}
