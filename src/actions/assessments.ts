'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createQuestionBankSchema, createQuestionSchema, createAssessmentSchema } from '@/lib/schemas';

async function requireTeacher() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'teacher') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

// ==================== BANCO DE QUESTÕES ====================

export async function getQuestionBanks(subject?: string) {
  const user = await requireTeacher();
  
  const where: any = { teacherId: user.id };
  if (subject) {
    where.subject = subject;
  }
  
  return prisma.questionBank.findMany({
    where,
    include: {
      _count: { select: { questions: true } }
    },
    orderBy: { name: 'asc' }
  });
}

export async function getQuestionBankById(id: string) {
  return prisma.questionBank.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: 'asc' } }
    }
  });
}

export async function createQuestionBank(formData: FormData) {
  const user = await requireTeacher();
  
  try {
    const data = {
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      description: formData.get('description') as string || null,
      tags: formData.get('tags') as string || null,
    };
    
    const validated = createQuestionBankSchema.parse(data);
    
    await prisma.questionBank.create({
      data: {
        ...validated,
        teacherId: user.id,
        tags: validated.tags || null,
      }
    });
    
    revalidatePath('/teacher/assessments');
  } catch (err: any) {
    return { error: err.message || 'Erro ao criar banco de questões' };
  }
}

export async function deleteQuestionBank(id: string) {
  const user = await requireTeacher();
  
  try {
    await prisma.questionBank.delete({
      where: { id, teacherId: user.id }
    });
    
    revalidatePath('/teacher/assessments');
  } catch (err) {
    return { error: 'Erro ao excluir banco de questões' };
  }
}

// ==================== QUESTÕES ====================

export async function getQuestions(bankId: string) {
  return prisma.question.findMany({
    where: { bankId },
    orderBy: { order: 'asc' }
  });
}

export async function createQuestion(formData: FormData) {
  const user = await requireTeacher();
  
  try {
    const options = formData.get('options') as string || null;
    const data = {
      bankId: formData.get('bankId') as string || null,
      type: formData.get('type') as string,
      content: formData.get('content') as string,
      options,
      correctAnswer: formData.get('correctAnswer') as string,
      points: parseFloat(formData.get('points') as string) || 1,
      explanation: formData.get('explanation') as string || null,
    };
    
    const validated = createQuestionSchema.parse(data);
    
    const questionCount = await prisma.question.count({
      where: { bankId: validated.bankId || undefined }
    });
    
    await prisma.question.create({
      data: {
        ...validated,
        order: questionCount + 1,
      }
    });
    
    revalidatePath('/teacher/assessments');
  } catch (err: any) {
    return { error: err.message || 'Erro ao criar questão' };
  }
}

export async function updateQuestion(id: string, formData: FormData) {
  const user = await requireTeacher();
  
  try {
    await prisma.question.update({
      where: { id },
      data: {
        content: formData.get('content') as string,
        options: formData.get('options') as string || null,
        correctAnswer: formData.get('correctAnswer') as string,
        points: parseFloat(formData.get('points') as string) || 1,
        explanation: formData.get('explanation') as string || null,
      }
    });
    
    revalidatePath('/teacher/assessments');
  } catch (err) {
    return { error: 'Erro ao atualizar questão' };
  }
}

export async function deleteQuestion(id: string) {
  try {
    await prisma.question.delete({ where: { id } });
    revalidatePath('/teacher/assessments');
  } catch (err) {
    return { error: 'Erro ao excluir questão' };
  }
}

// ==================== AVALIAÇÕES ONLINE ====================

export async function getAssessments(classId?: string, status?: string) {
  const user = await requireTeacher();
  
  const where: any = { teacherId: user.id };
  if (classId) where.classId = classId;
  if (status) where.status = status;
  
  return prisma.assessment.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      _count: { select: { questions: true, submissions: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAssessmentById(id: string) {
  return prisma.assessment.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true } },
      questions: { orderBy: { order: 'asc' } },
      _count: { select: { submissions: true } }
    }
  });
}

export async function createAssessment(formData: FormData) {
  const user = await requireTeacher();
  
  try {
    const scheduledAt = formData.get('scheduledAt') as string;
    const data = {
      classId: formData.get('classId') as string || null,
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      subject: formData.get('subject') as string,
      type: formData.get('type') as string,
      duration: formData.get('duration') ? parseInt(formData.get('duration') as string) : null,
      shuffleQuestions: formData.get('shuffleQuestions') === 'true',
      shuffleOptions: formData.get('shuffleOptions') === 'true',
      showResults: formData.get('showResults') !== 'false',
      passingScore: parseFloat(formData.get('passingScore') as string) || 5,
      status: formData.get('status') as string || 'draft',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    };
    
    const validated = createAssessmentSchema.parse(data);
    
    await prisma.assessment.create({
      data: {
        ...validated,
        teacherId: user.id,
        scheduledAt: validated.scheduledAt || null,
      }
    });
    
    revalidatePath('/teacher/assessments');
  } catch (err: any) {
    return { error: err.message || 'Erro ao criar avaliação' };
  }
}

export async function updateAssessment(id: string, formData: FormData) {
  const user = await requireTeacher();
  
  try {
    const scheduledAt = formData.get('scheduledAt') as string;
    await prisma.assessment.update({
      where: { id, teacherId: user.id },
      data: {
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        subject: formData.get('subject') as string,
        type: formData.get('type') as string,
        duration: formData.get('duration') ? parseInt(formData.get('duration') as string) : null,
        shuffleQuestions: formData.get('shuffleQuestions') === 'true',
        shuffleOptions: formData.get('shuffleOptions') === 'true',
        showResults: formData.get('showResults') !== 'false',
        passingScore: parseFloat(formData.get('passingScore') as string) || 5,
        status: formData.get('status') as string,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        publishedAt: formData.get('status') === 'published' ? new Date() : undefined,
      }
    });
    
    revalidatePath('/teacher/assessments');
  } catch (err) {
    return { error: 'Erro ao atualizar avaliação' };
  }
}

export async function deleteAssessment(id: string) {
  const user = await requireTeacher();
  
  try {
    await prisma.assessment.delete({
      where: { id, teacherId: user.id }
    });
    
    revalidatePath('/teacher/assessments');
  } catch (err) {
    return { error: 'Erro ao excluir avaliação' };
  }
}

export async function publishAssessment(id: string) {
  const user = await requireTeacher();
  
  try {
    await prisma.assessment.update({
      where: { id, teacherId: user.id },
      data: { 
        status: 'published',
        publishedAt: new Date()
      }
    });
    
    revalidatePath('/teacher/assessments');
  } catch (err) {
    return { error: 'Erro ao publicar avaliação' };
  }
}

// ==================== SUBMISSÕES / CORREÇÃO ====================

export async function getSubmissions(assessmentId: string) {
  const user = await requireTeacher();
  
  return prisma.submission.findMany({
    where: { assessment: { teacherId: user.id, id: assessmentId } },
    include: {
      student: { select: { id: true, name: true, class: { select: { name: true } } } }
    },
    orderBy: { submittedAt: 'desc' }
  });
}

export async function gradeSubmission(submissionId: string, score: number, feedback?: string) {
  const user = await requireTeacher();
  
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assessment: true }
    });
    
    if (!submission || submission.assessment.teacherId !== user.id) {
      throw new Error('Unauthorized');
    }
    
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score,
        isGraded: true,
        gradedAt: new Date(),
        feedback
      }
    });
    
    revalidatePath('/teacher/assessments');
  } catch (err) {
    return { error: 'Erro ao corrigir submissão' };
  }
}

export async function autoGrade(submissionId: string, answers: Record<string, string>) {
  const user = await requireTeacher();
  
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assessment: {
          include: { questions: true }
        }
      }
    });
    
    if (!submission || submission.assessment.teacherId !== user.id) {
      throw new Error('Unauthorized');
    }
    
    let totalScore = 0;
    let maxScore = 0;
    
    for (const question of submission.assessment.questions) {
      const userAnswer = answers[`question_${question.id}`];
      const correctAnswer = JSON.parse(question.correctAnswer);
      
      maxScore += question.points;
      
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        if (userAnswer === correctAnswer.answer) {
          totalScore += question.points;
        }
      }
    }
    
    const percentage = (totalScore / maxScore) * 10;
    
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: percentage,
        maxScore,
        isGraded: true,
        gradedAt: new Date(),
        feedback: `Correção automática: ${totalScore}/${maxScore} pontos`
      }
    });
    
    return { score: percentage, totalScore, maxScore };
  } catch (err) {
    return { error: 'Erro ao corrigir automaticamente' };
  }
}

// ==================== ATIVIDADES (já existem, mas movemos para cá) ====================

export async function getActivities(classId?: string, subject?: string) {
  const user = await requireTeacher();
  
  const where: any = { teacherId: user.id };
  if (classId) where.classId = classId;
  if (subject) where.subject = subject;
  
  return prisma.activityBank.findMany({
    where,
    include: { class: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createActivity(formData: FormData) {
  const user = await requireTeacher();
  
  try {
    const data = {
      classId: formData.get('classId') as string || null,
      subject: formData.get('subject') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      activityType: formData.get('activityType') as string,
      difficulty: formData.get('difficulty') as string || 'medio',
      content: formData.get('content') as string || null,
      answer: formData.get('answer') as string || null,
      tags: formData.get('tags') as string || null,
    };
    
    await prisma.activityBank.create({
      data: {
        teacher: { connect: { id: user.id } },
        class: data.classId ? { connect: { id: data.classId } } : undefined,
        subject: data.subject,
        title: data.title,
        activityType: data.activityType,
        description: data.description,
        difficulty: data.difficulty,
        content: data.content,
        answer: data.answer,
        tags: data.tags,
      }
    });
    
    revalidatePath('/teacher/activities');
  } catch (err: any) {
    return { error: err.message || 'Erro ao criar atividade' };
  }
}

export async function deleteActivity(id: string) {
  const user = await requireTeacher();
  
  try {
    await prisma.activityBank.delete({
      where: { id, teacherId: user.id }
    });
    
    revalidatePath('/teacher/activities');
  } catch (err) {
    return { error: 'Erro ao excluir atividade' };
  }
}