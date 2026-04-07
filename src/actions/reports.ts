'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';

const GROK_API_KEY = process.env.GROK_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'grok';
const AI_MODEL = process.env.AI_MODEL || 'grok-2';

async function callGrok(systemPrompt: string, userMessage: string) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROK_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

export async function askAIAboutCurrentReport(message: string, reportData: any, reportType: 'class' | 'student') {
  const session = await getSession();
  if (!session?.user) {
    return { response: 'Unauthorized', type: 'error' };
  }
  
  if (!GROK_API_KEY) {
    return { 
      response: "API de IA não configurada. Configure GROK_API_KEY no arquivo .env",
      type: 'error'
    };
  }
  
  try {
    const reportContext = JSON.stringify(reportData, null, 2);
    
    const systemPrompt = `Você é um assistente pedagógico inteligente do sistema NSteacher.
O professor está可视化的 um relatório ${reportType === 'class' ? 'de turma' : 'de aluno'} específico e quer fazer perguntas sobre ele.

RELATÓRIO ATUAL:
${reportContext}

Seu papel é:
1. Responder perguntas específicas sobre este relatório
2. Analisar os dados apresentados
3. Sugerir ações pedagógicas baseadas nos dados
4. Explicar métricas e estatísticas do relatório

Seja específico citando os dados do relatório.
Use formatação clara com markdown.
Responda sempre em português brasileiro.`;

    const response = await callGrok(systemPrompt, message);
    
    return { response, type: 'success' };
  } catch (error: any) {
    return { response: `Erro ao processar pergunta: ${error.message}`, type: 'error' };
  }
}

export async function getStudentAverage(studentId: string, subject?: string) {
  const session = await getSession();
  if (!session?.user) return null;

  const where: any = { studentId, teacherId: session.user.id };
  if (subject) where.subject = subject;

  const grades = await prisma.grade.findMany({
    where,
    orderBy: { date: 'asc' }
  });

  if (grades.length === 0) return null;

  const weightedSum = grades.reduce((acc, grade) => {
    return acc + (grade.value * grade.weight);
  }, 0);

  const totalWeight = grades.reduce((acc, grade) => acc + grade.weight, 0);

  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

export async function getClassAverages(classId: string, subject?: string) {
  const session = await getSession();
  if (!session?.user) return [];

  const where: any = { classId, teacherId: session.user.id };
  if (subject) where.subject = subject;

  const students = await prisma.student.findMany({
    where: { classId },
    include: { grades: { where } }
  });

  return students.map(student => {
    const grades = student.grades;
    if (grades.length === 0) return { studentId: student.id, studentName: student.name, average: null };

    const weightedSum = grades.reduce((acc, grade) => acc + (grade.value * grade.weight), 0);
    const totalWeight = grades.reduce((acc, grade) => acc + grade.weight, 0);
    const average = totalWeight > 0 ? weightedSum / totalWeight : null;

    return { studentId: student.id, studentName: student.name, average };
  });
}

export async function getSubjectStats(classId: string, subject: string) {
  const session = await getSession();
  if (!session?.user) return null;

  const grades = await prisma.grade.findMany({
    where: { classId, subject, teacherId: session.user.id }
  });

  if (grades.length === 0) return null;

  const values = grades.map(g => g.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0 
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
    : sorted[Math.floor(sorted.length / 2)];
  
  const min = Math.min(...values);
  const max = Math.max(...values);

  const above7 = values.filter(v => v >= 7).length;
  const below5 = values.filter(v => v < 5).length;

  return {
    count: values.length,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    min,
    max,
    above7: Math.round((above7 / values.length) * 100),
    below5: Math.round((below5 / values.length) * 100),
    distribution: {
      '0-2': values.filter(v => v < 2).length,
      '2-5': values.filter(v => v >= 2 && v < 5).length,
      '5-7': values.filter(v => v >= 5 && v < 7).length,
      '7-9': values.filter(v => v >= 7 && v < 9).length,
      '9-10': values.filter(v => v >= 9).length,
    }
  };
}

export async function generateStudentReport(studentId: string) {
  const session = await getSession();
  if (!session?.user) return null;

  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId: session.user.id },
    include: { 
      class: true,
      grades: { orderBy: { date: 'asc' } }
    }
  });

  if (!student) return null;

  const subjects = Array.from(new Set(student.grades.map(g => g.subject)));
  
  const gradesBySubject = subjects.map(subject => {
    const grades = student.grades.filter(g => g.subject === subject);
    const weightedSum = grades.reduce((acc, g) => acc + (g.value * g.weight), 0);
    const totalWeight = grades.reduce((acc, g) => acc + g.weight, 0);
    const average = totalWeight > 0 ? weightedSum / totalWeight : null;

    return {
      subject,
      grades: grades.map(g => ({
        assessmentName: g.assessmentName,
        assessmentType: g.assessmentType,
        value: g.value,
        weight: g.weight,
        date: g.date
      })),
      average: average ? Math.round(average * 100) / 100 : null,
      totalGrades: grades.length
    };
  });

  const overallWeightedSum = student.grades.reduce((acc, g) => acc + (g.value * g.weight), 0);
  const overallTotalWeight = student.grades.reduce((acc, g) => acc + g.weight, 0);
  const overallAverage = overallTotalWeight > 0 ? overallWeightedSum / overallTotalWeight : null;

  return {
    student: {
      id: student.id,
      name: student.name,
      class: student.class.name,
      year: student.class.year
    },
    subjects: gradesBySubject,
    overallAverage: overallAverage ? Math.round(overallAverage * 100) / 100 : null,
    totalGrades: student.grades.length,
    totalSubjects: subjects.length
  };
}

export async function generateClassReport(classId: string) {
  const session = await getSession();
  if (!session?.user) return null;

  const classData = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
    include: {
      students: true,
      grades: true
    }
  });

  if (!classData) return null;

  const subjects = Array.from(new Set(classData.grades.map(g => g.subject)));
  
  const subjectStats = await Promise.all(
    subjects.map(async subject => {
      const grades = classData.grades.filter(g => g.subject === subject);
      const values = grades.map(g => g.value);
      
      const studentAverages = await getClassAverages(classId, subject);
      const validAverages = studentAverages.filter(s => s.average !== null);
      const classAverage = validAverages.length > 0 
        ? validAverages.reduce((a, b) => a + (b.average || 0), 0) / validAverages.length 
        : null;

      return {
        subject,
        totalGrades: grades.length,
        classAverage: classAverage ? Math.round(classAverage * 100) / 100 : null,
        above7: validAverages.filter(s => (s.average || 0) >= 7).length,
        between5and7: validAverages.filter(s => (s.average || 0) >= 5 && (s.average || 0) < 7).length,
        below5: validAverages.filter(s => (s.average || 0) < 5).length
      };
    })
  );

  const allStudentAverages = await getClassAverages(classId);
  const validAverages = allStudentAverages.filter(s => s.average !== null);
  const overallClassAverage = validAverages.length > 0
    ? validAverages.reduce((a, b) => a + (b.average || 0), 0) / validAverages.length
    : null;

  return {
    class: {
      id: classData.id,
      name: classData.name,
      year: classData.year,
      level: classData.level,
      totalStudents: classData.students.length
    },
    subjects: subjectStats,
    overallClassAverage: overallClassAverage ? Math.round(overallClassAverage * 100) / 100 : null,
    totalGrades: classData.grades.length
  };
}

export async function generateBulletin(studentId: string, period?: string) {
  const report = await generateStudentReport(studentId);
  if (!report) return null;

  const periodGrades = period 
    ? report.subjects.map(subject => ({
        ...subject,
        grades: subject.grades.filter(g => {
          const date = new Date(g.date);
          if (period === '1') return date.getMonth() < 6;
          if (period === '2') return date.getMonth() >= 6;
          return true;
        })
      })).map(s => ({
        ...s,
        average: calculatePeriodAverage(s.grades)
      }))
    : report.subjects;

  return {
    ...report,
    periods: periodGrades,
    finalAverage: period 
      ? calculatePeriodAverage(periodGrades.flatMap(s => s.grades))
      : report.overallAverage
  };
}

function calculatePeriodAverage(grades: { value: number; weight: number }[]) {
  if (grades.length === 0) return null;
  const weightedSum = grades.reduce((acc, g) => acc + (g.value * g.weight), 0);
  const totalWeight = grades.reduce((acc, g) => acc + g.weight, 0);
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : null;
}