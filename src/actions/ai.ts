'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

async function requireTeacher() {
  const session = await getSession();
  if (!session?.user || session.user.role !== 'teacher') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

// ==================== AI CHAT PARA RELATÓRIOS ====================

export async function askAIAboutReports(message: string) {
  const user = await requireTeacher();
  
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY && !GROK_API_KEY) {
    return { 
      response: "API de IA não configurada. Configure OPENAI_API_KEY, ANTHROPIC_API_KEY ou GROK_API_KEY no arquivo .env",
      type: 'error'
    };
  }
  
  try {
    const teacherData = await getTeacherDataForAI(user.id);
    
    const systemPrompt = `Você é um assistente pedagógico inteligente para o sistema NSteacher. 
Você tem acesso aos dados do professor: ${JSON.stringify(teacherData)}.

Seu papel é:
1. Analisar o desempenho dos alunos e turmas
2. Identificar padrões e tendências
3. Sugerir ações pedagógicas
4. Explicar métricas e estatísticas
5. Criar insights sobre o progresso dos alunos

Sempre que possível, seja específico citando dados concretos.
Se houver alunos em risco (média < 5), destaque isso.
Use formatação clara com markdown.`;

    let response;
    
    if (AI_PROVIDER === 'anthropic' && ANTHROPIC_API_KEY) {
      response = await callAnthropic(systemPrompt, message);
    } else if (AI_PROVIDER === 'grok' && GROK_API_KEY) {
      response = await callGrok(systemPrompt, message);
    } else {
      response = await callOpenAI(systemPrompt, message);
    }
    
    return { response, type: 'success' };
  } catch (error: any) {
    return { response: `Erro ao processar pergunta: ${error.message}`, type: 'error' };
  }
}

async function callOpenAI(systemPrompt: string, userMessage: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
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
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(systemPrompt: string, userMessage: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01'
    }),
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.content[0].text;
}

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

async function getTeacherDataForAI(teacherId: string) {
  const [classes, students, grades, lessons, topics] = await Promise.all([
    prisma.class.findMany({ 
      where: { teacherId },
      select: { id: true, name: true, year: true, level: true }
    }),
    prisma.student.findMany({ 
      where: { teacherId },
      select: { id: true, name: true, classId: true, status: true }
    }),
    prisma.grade.findMany({ 
      where: { teacherId },
      select: { studentId: true, subject: true, value: true, weight: true, assessmentType: true }
    }),
    prisma.lesson.findMany({ 
      where: { teacherId },
      select: { id: true, classId: true, subject: true, theme: true, status: true }
    }),
    prisma.curriculumTopic.findMany({ 
      where: { teacherId },
      select: { id: true, classId: true, subject: true, topic: true, status: true }
    })
  ]);
  
  const studentsWithGrades = students.map(student => {
    const studentGrades = grades.filter(g => g.studentId === student.id);
    const avg = studentGrades.length > 0 
      ? studentGrades.reduce((sum, g) => sum + (g.value * g.weight), 0) / studentGrades.reduce((sum, g) => sum + g.weight, 0)
      : null;
    return { ...student, average: avg ? avg.toFixed(2) : null };
  });
  
  const atRiskStudents = studentsWithGrades.filter(s => s.average && parseFloat(s.average) < 5);
  
  const subjectStats = Array.from(new Set(grades.map(g => g.subject))).map(subject => {
    const subjectGrades = grades.filter(g => g.subject === subject);
    const avg = subjectGrades.reduce((sum, g) => sum + g.value, 0) / subjectGrades.length;
    return { subject, average: avg.toFixed(2), count: subjectGrades.length };
  });
  
  return {
    classes,
    totalStudents: students.length,
    totalGrades: grades.length,
    totalLessons: lessons.length,
    totalTopics: topics.length,
    atRiskStudents: atRiskStudents.length,
    atRiskDetails: atRiskStudents.slice(0, 5),
    subjectStats,
    recentGrades: grades.slice(0, 10)
  };
}

// ==================== AI LESSON PLANNER ====================

export async function generateLessonPlan(theme: string, subject: string, classLevel?: string) {
  if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY && !GROK_API_KEY) {
    return { 
      response: "API de IA não configurada. Configure OPENAI_API_KEY, ANTHROPIC_API_KEY ou GROK_API_KEY no arquivo .env",
      type: 'error'
    };
  }
  
  try {
    const systemPrompt = `Você é um assistente de planejamento de aulas especializado na BNCC (Base Nacional Comum Curricular) brasileira.
Gere planos de aula detalhados e práticos baseados no tema fornecido.

O plano deve incluir:
1. Título e descrição breve
2. Objetivos de aprendizagem (Competências BNCC relacionadas)
3. Conteúdo/materia a ser abordada
4. Atividades propostas (início, desenvolvimento e encerramento)
5. Recursos necessários
6. Avaliação formativa
7. Duração estimada

Use formato JSON estruturado para facilitar a integração.`;

    const userMessage = `Tema: ${theme}
Disciplina: ${subject}
${classLevel ? `Nível/Turma: ${classLevel}` : ''}

Gere um plano de aula detalhado e prático.`;

    let response;
    
    if (AI_PROVIDER === 'anthropic' && ANTHROPIC_API_KEY) {
      response = await callAnthropic(systemPrompt, userMessage);
    } else if (AI_PROVIDER === 'grok' && GROK_API_KEY) {
      response = await callGrok(systemPrompt, userMessage);
    } else {
      response = await callOpenAI(systemPrompt, userMessage);
    }
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch {
      parsedResponse = { rawResponse: response };
    }
    
    return { response: parsedResponse, type: 'success' };
  } catch (error: any) {
    return { response: `Erro ao gerar plano: ${error.message}`, type: 'error' };
  }
}

// ==================== ANALYTICS ====================

export async function getAnalyticsDashboard(classId?: string) {
  const user = await requireTeacher();
  
  const where: any = { teacherId: user.id };
  if (classId) where.classId = classId;
  
  const [classes, students, grades] = await Promise.all([
    prisma.class.findMany({ where: { teacherId: user.id } }),
    prisma.student.findMany({ where }),
    prisma.grade.findMany({ where })
  ]);
  
  const studentStats = students.map(student => {
    const studentGrades = grades.filter(g => g.studentId === student.id);
    const avg = studentGrades.length > 0 
      ? studentGrades.reduce((sum, g) => sum + (g.value * g.weight), 0) / studentGrades.reduce((sum, g) => sum + g.weight, 0)
      : 0;
    return {
      id: student.id,
      name: student.name,
      classId: student.classId,
      totalGrades: studentGrades.length,
      average: avg
    };
  }).sort((a, b) => a.average - b.average);
  
  const atRisk = studentStats.filter(s => s.average < 5 && s.totalGrades > 0);
  const excellent = studentStats.filter(s => s.average >= 8 && s.totalGrades > 0);
  
  const subjectStats = Array.from(new Set(grades.map(g => g.subject))).map(subject => {
    const subjectGrades = grades.filter(g => g.subject === subject);
    const values = subjectGrades.map(g => g.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    return {
      subject,
      average: avg.toFixed(2),
      median: median.toFixed(2),
      min,
      max,
      totalGrades: subjectGrades.length
    };
  });
  
  const gradeDistribution = {
    '0-4': grades.filter(g => g.value < 4).length,
    '4-6': grades.filter(g => g.value >= 4 && g.value < 6).length,
    '6-8': grades.filter(g => g.value >= 6 && g.value < 8).length,
    '8-10': grades.filter(g => g.value >= 8).length
  };
  
  return {
    totalClasses: classes.length,
    totalStudents: students.length,
    totalGrades: grades.length,
    studentStats,
    atRiskStudents: atRisk,
    excellentStudents: excellent,
    subjectStats,
    gradeDistribution
  };
}

export async function getStudentAnalytics(studentId: string) {
  const user = await requireTeacher();
  
  const student = await prisma.student.findFirst({
    where: { id: studentId, teacherId: user.id },
    include: { class: true }
  });
  
  if (!student) {
    return { error: 'Aluno não encontrado' };
  }
  
  const grades = await prisma.grade.findMany({
    where: { studentId, teacherId: user.id }
  });
  
  const subjectGrades = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = [];
    }
    acc[grade.subject].push(grade);
    return acc;
  }, {} as Record<string, typeof grades>);
  
  const subjectAverages = Object.entries(subjectGrades).map(([subject, studentGrades]) => {
    const avg = studentGrades.reduce((sum, g) => sum + (g.value * g.weight), 0) / studentGrades.reduce((sum, g) => sum + g.weight, 0);
    return { subject, average: avg.toFixed(2), count: studentGrades.length };
  });
  
  const overallAvg = grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.value * g.weight), 0) / grades.reduce((sum, g) => sum + g.weight, 0)
    : 0;
  
  const isAtRisk = overallAvg < 5 && grades.length > 0;
  
  return {
    student,
    totalGrades: grades.length,
    overallAverage: overallAvg.toFixed(2),
    subjectAverages,
    isAtRisk,
    grades: grades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  };
}

// ==================== ALERTAS AUTOMÁTICOS ====================

export async function checkAndCreateRiskAlerts() {
  const users = await prisma.user.findMany({
    where: { role: 'teacher' }
  });
  
  for (const user of users) {
    const students = await prisma.student.findMany({
      where: { teacherId: user.id, status: 'active' }
    });
    
    for (const student of students) {
      const grades = await prisma.grade.findMany({
        where: { studentId: student.id }
      });
      
      if (grades.length >= 3) {
        const avg = grades.reduce((sum, g) => sum + (g.value * g.weight), 0) / grades.reduce((sum, g) => sum + g.weight, 0);
        
        if (avg < 5) {
          const existingAlert = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              title: `Alerta: ${student.name} em risco`,
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          });
          
          if (!existingAlert) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: `Alerta: ${student.name} em risco`,
                message: `O aluno ${student.name} está com média ${avg.toFixed(2)} e precisa de atenção. Considere estratégias de apoio.`,
                type: 'warning'
              }
            });
          }
        }
      }
    }
  }
  
  return { message: 'Alertas verificados' };
}