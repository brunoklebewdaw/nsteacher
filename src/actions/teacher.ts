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

export async function getTeacherData() {
  const session = await getSession();
  if (!session?.user) return null;
  const teacherId = session.user.id;

  const [classes, students, lessons, topics, grades, materials, userData, accessKey] = await Promise.all([
    prisma.class.findMany({ 
      where: { teacherId },
      include: { _count: { select: { students: true } } }
    }),
    prisma.student.findMany({ 
      where: { teacherId },
      include: { class: true }
    }),
    prisma.lesson.findMany({ 
      where: { teacherId },
      include: { class: true },
      orderBy: { date: 'desc' },
      take: 50
    }),
    prisma.curriculumTopic.findMany({ 
      where: { teacherId },
      include: { class: true }
    }),
    prisma.grade.findMany({ 
      where: { teacherId },
      include: { student: true, class: true },
      orderBy: { date: 'desc' },
      take: 100
    }),
    prisma.material.findMany({ 
      where: { teacherId },
      include: { class: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    prisma.user.findUnique({
      where: { id: teacherId },
      select: { name: true }
    }),
    prisma.accessKey.findFirst({
      where: { 
        teacherId: teacherId,
        status: 'used'
      },
      select: { expiresAt: true }
    })
  ]);
  
  const allSubjects = Array.from(new Set([
    ...grades.map(g => g.subject),
    ...lessons.map(l => l.subject),
    ...materials.map(m => m.subject),
    ...topics.map(t => t.subject)
  ])).sort();
  
  return { 
    classes, 
    students, 
    lessons, 
    topics, 
    grades, 
    materials, 
    subjects: allSubjects,
    userName: userData?.name || 'Professor',
    accessExpiresAt: accessKey?.expiresAt || null
  };
}

export async function completeTeacherSetup(formData: FormData) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const subjects = formData.get('subjects') as string;
    const classesStr = formData.get('classes') as string;
    const classes = JSON.parse(classesStr);

    await prisma.user.update({
      where: { id: teacherId },
      data: { 
        subjects,
        setupCompleted: true
      }
    });

    await prisma.class.createMany({
      data: classes.map((cls: any) => ({
        teacherId,
        name: cls.name,
        level: cls.level,
        year: cls.year,
        school: 'N/A'
      }))
    });

    revalidatePath('/teacher');
  } catch (err) {
    return { error: 'Erro ao completar configuração' };
  }
}

export async function createClass(formData: FormData) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const name = formData.get('name') as string;
    const year = parseInt(formData.get('year') as string);
    const level = formData.get('level') as string || 'Fundamental';

    if (!name || isNaN(year)) {
      return { error: 'Dados inválidos para criação de turma' };
    }

    await prisma.class.create({
      data: {
        teacherId,
        name,
        year,
        level
      }
    });
    revalidatePath('/teacher/students');
  } catch (err) {
    console.error('Error creating class:', err);
    return { error: 'Erro ao criar turma' };
  }
}

export async function createStudent(formData: FormData) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const name = formData.get('name') as string;
    const classId = formData.get('classId') as string;

    await prisma.student.create({
      data: { teacherId, classId, name }
    });
    revalidatePath('/teacher/students');
  } catch (err) {
    return { error: 'Erro ao criar aluno' };
  }
}

export async function createTopic(formData: FormData) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const topic = formData.get('topic') as string;
    const status = formData.get('status') as string || 'not-started';

    await prisma.curriculumTopic.create({
      data: { teacherId, classId, subject, topic, status }
    });
    revalidatePath('/teacher/planning');
    revalidatePath('/teacher/reports');
  } catch (err) {
    return { error: 'Erro ao criar tópico' };
  }
}

export async function updateTopicStatus(id: string, status: string) {
  const user = await requireTeacher();

  try {
    await prisma.curriculumTopic.update({
      where: { id, teacherId: user.id },
      data: { status }
    });
    revalidatePath('/teacher/planning');
    revalidatePath('/teacher/reports');
  } catch (err) {
    return { error: 'Erro ao atualizar status' };
  }
}

export async function createGrade(formData: FormData) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const studentId = formData.get('studentId') as string;
    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const assessmentName = formData.get('assessmentName') as string;
    const assessmentType = formData.get('assessmentType') as string || 'nota';
    const weight = parseFloat(formData.get('weight') as string) || 1.0;
    const value = parseFloat(formData.get('value') as string);
    const date = new Date(formData.get('date') as string);

    await prisma.grade.create({
      data: { teacherId, studentId, classId, subject, assessmentName, assessmentType, weight, value, date }
    });
    revalidatePath('/teacher/assessments');
    revalidatePath('/teacher/reports');
    revalidatePath('/teacher');
  } catch (err) {
    return { error: 'Erro ao criar nota' };
  }
}

export async function createLesson(formData: FormData) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const theme = formData.get('theme') as string;
    const content = formData.get('content') as string;
    const objective = formData.get('objective') as string;
    const activities = formData.get('activities') as string;
    const status = formData.get('status') as string || 'planned';
    const observations = formData.get('observations') as string;
    const date = new Date(formData.get('date') as string);

    await prisma.lesson.create({
      data: { teacherId, classId, subject, theme, content, objective, activities, status, observations, date }
    });
    revalidatePath('/teacher');
    revalidatePath('/teacher/schedule');
  } catch (err) {
    return { error: 'Erro ao criar aula' };
  }
}

export async function updateLesson(id: string, formData: FormData) {
  const user = await requireTeacher();

  try {
    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const theme = formData.get('theme') as string;
    const content = formData.get('content') as string;
    const objective = formData.get('objective') as string;
    const activities = formData.get('activities') as string;
    const status = formData.get('status') as string;
    const observations = formData.get('observations') as string;
    const date = new Date(formData.get('date') as string);

    await prisma.lesson.update({
      where: { id, teacherId: user.id },
      data: { classId, subject, theme, content, objective, activities, status, observations, date }
    });
    revalidatePath('/teacher');
    revalidatePath('/teacher/schedule');
  } catch (err) {
    return { error: 'Erro ao atualizar aula' };
  }
}

export async function createMaterial(formData: FormData) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const classId = formData.get('classId') as string || null;
    const subject = formData.get('subject') as string;
    const title = formData.get('title') as string;
    const url = formData.get('url') as string;
    const type = formData.get('type') as string;
    const category = formData.get('category') as string || null;
    const tags = formData.get('tags') as string || null;
    const description = formData.get('description') as string || null;

    await prisma.material.create({
      data: { teacherId, classId, subject, title, url, type, category, tags, description }
    });
    revalidatePath('/teacher/materials');
  } catch (err) {
    return { error: 'Erro ao criar material' };
  }
}

export async function deleteMaterial(id: string) {
  const user = await requireTeacher();

  try {
    await prisma.material.delete({
      where: { id, teacherId: user.id }
    });
    revalidatePath('/teacher/materials');
  } catch (err) {
    return { error: 'Erro ao excluir material' };
  }
}

export async function deleteStudent(id: string) {
  const user = await requireTeacher();

  try {
    await prisma.student.delete({
      where: { id, teacherId: user.id }
    });
    revalidatePath('/teacher/students');
  } catch (err) {
    return { error: 'Erro ao excluir aluno' };
  }
}

export async function updateStudentStatus(id: string, status: string) {
  const user = await requireTeacher();

  try {
    await prisma.student.update({
      where: { id, teacherId: user.id },
      data: { status }
    });
    revalidatePath('/teacher/students');
  } catch (err) {
    return { error: 'Erro ao atualizar status' };
  }
}

export async function deleteClass(id: string) {
  const user = await requireTeacher();

  try {
    await prisma.class.delete({
      where: { id, teacherId: user.id }
    });
    revalidatePath('/teacher/students');
  } catch (err) {
    return { error: 'Erro ao excluir turma' };
  }
}

export async function deleteLesson(id: string) {
  const user = await requireTeacher();

  try {
    await prisma.lesson.delete({
      where: { id, teacherId: user.id }
    });
    revalidatePath('/teacher');
    revalidatePath('/teacher/schedule');
  } catch (err) {
    return { error: 'Erro ao excluir aula' };
  }
}

export async function getSubjects() {
  const session = await getSession();
  if (!session?.user) return [];
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subjects: true }
  });
  
  if (!user?.subjects) return [];
  return JSON.parse(user.subjects);
}

export async function saveSubjects(subjectsJson: string) {
  const user = await requireTeacher();
  
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { subjects: subjectsJson }
    });
    revalidatePath('/teacher/subjects');
  } catch (err) {
    return { error: 'Erro ao salvar disciplinas' };
  }
}

export async function importStudents(students: { name: string; classId?: string }[]) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const userClasses = await prisma.class.findMany({
      where: { teacherId },
      select: { id: true }
    });

    const defaultClassId = userClasses[0]?.id;
    if (!defaultClassId) {
      return { error: 'Nenhuma turma encontrada. Crie uma turma primeiro.' };
    }

    const studentData = students.map(s => ({
      teacherId,
      classId: s.classId || defaultClassId,
      name: s.name
    }));

    await prisma.student.createMany({
      data: studentData
    });

    revalidatePath('/teacher/students');
    return { success: true, count: students.length };
  } catch (err) {
    return { error: 'Erro ao importar alunos' };
  }
}

export async function importStudentsFromCSV(csvContent: string) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const userClasses = await prisma.class.findMany({
      where: { teacherId },
      select: { id: true, name: true }
    });

    const defaultClassId = userClasses[0]?.id;
    if (!defaultClassId) {
      return { error: 'Nenhuma turma encontrada. Crie uma turma primeiro.' };
    }

    const lines = csvContent.split('\n').filter(line => line.trim());
    const students: { name: string; classId?: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      const name = parts[0];
      const className = parts[1];

      if (name) {
        const classItem = userClasses.find(c => c.name.toLowerCase() === className?.toLowerCase());
        students.push({
          name,
          classId: classItem?.id || defaultClassId
        });
      }
    }

    if (students.length === 0) {
      return { error: 'Nenhum aluno encontrado no CSV' };
    }

    const studentData = students.map(s => ({
      teacherId,
      classId: s.classId || defaultClassId,
      name: s.name
    }));

    await prisma.student.createMany({
      data: studentData
    });

    revalidatePath('/teacher/students');
    return { success: true, count: students.length };
  } catch (err) {
    return { error: 'Erro ao importar alunos do CSV' };
  }
}

export async function createActivitiesFromDocument(formData: FormData) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const documentText = formData.get('documentText') as string;
    const classId = formData.get('classId') as string || null;
    const subject = formData.get('subject') as string;
    const activityType = formData.get('activityType') as string || 'exercicio';
    const difficulty = formData.get('difficulty') as string || 'medio';

    if (!documentText?.trim()) {
      return { error: 'Texto do documento é obrigatório' };
    }

    const paragraphs = documentText
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 10);

    if (paragraphs.length === 0) {
      return { error: 'Nenhum parágrafo válido encontrado no documento' };
    }

    const activities = paragraphs.map((content, index) => ({
      teacherId,
      classId,
      subject,
      title: `Atividade ${index + 1} - ${subject}`,
      content,
      activityType,
      difficulty,
      isActive: true
    }));

    await prisma.activityBank.createMany({
      data: activities
    });

    revalidatePath('/teacher/activities');
    return { success: true, count: activities.length };
  } catch (err) {
    return { error: 'Erro ao criar atividades do documento' };
  }
}

export async function createActivitiesFromText(textContent: string, options: {
  classId?: string;
  subject: string;
  activityType: string;
  difficulty: string;
  questionsPerActivity?: number;
}) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const { classId, subject, activityType, difficulty, questionsPerActivity = 5 } = options;
    
    const sentences = textContent
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    if (sentences.length === 0) {
      return { error: 'Nenhuma frase válida encontrada no texto' };
    }

    const activities = [];
    const chunks = [];
    
    for (let i = 0; i < sentences.length; i += questionsPerActivity) {
      chunks.push(sentences.slice(i, i + questionsPerActivity));
    }

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i].join('. ') + '.';
      activities.push({
        teacherId,
        classId: classId || null,
        subject,
        title: `Atividade ${i + 1} - ${subject}`,
        content,
        activityType,
        difficulty,
        isActive: true
      });
    }

    await prisma.activityBank.createMany({
      data: activities
    });

    revalidatePath('/teacher/activities');
    return { success: true, count: activities.length };
  } catch (err) {
    return { error: 'Erro ao criar atividades do texto' };
  }
}

export async function createBulkActivities(activities: {
  title: string;
  content?: string;
  classId?: string;
  subject: string;
  activityType: string;
  difficulty?: string;
  tags?: string;
}[]) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const activityData = activities.map(a => ({
      teacherId,
      classId: a.classId || null,
      subject: a.subject,
      title: a.title,
      content: a.content || null,
      activityType: a.activityType,
      difficulty: a.difficulty || 'medio',
      tags: a.tags || null,
      isActive: true
    }));

    await prisma.activityBank.createMany({
      data: activityData
    });

    revalidatePath('/teacher/activities');
    return { success: true, count: activities.length };
  } catch (err) {
    return { error: 'Erro ao criar atividades em lote' };
  }
}

export async function createBulkGrades(grades: {
  studentId: string;
  classId: string;
  subject: string;
  assessmentName: string;
  assessmentType?: string;
  weight?: number;
  value: number;
  date: string;
}[]) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const gradeData = grades.map(g => ({
      teacherId,
      studentId: g.studentId,
      classId: g.classId,
      subject: g.subject,
      assessmentName: g.assessmentName,
      assessmentType: g.assessmentType || 'nota',
      weight: g.weight || 1.0,
      value: g.value,
      date: new Date(g.date)
    }));

    await prisma.grade.createMany({
      data: gradeData
    });

    revalidatePath('/teacher/assessments');
    revalidatePath('/teacher/reports');
    return { success: true, count: grades.length };
  } catch (err) {
    return { error: 'Erro ao criar notas em lote' };
  }
}

export async function importGradesFromCSV(csvContent: string) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const grades: any[] = [];
    const students = await prisma.student.findMany({
      where: { teacherId },
      include: { class: true }
    });
    const classes = await prisma.class.findMany({
      where: { teacherId }
    });

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      const [studentName, className, subject, assessmentName, assessmentType, weight, value, date] = parts;

      const student = students.find(s => s.name.toLowerCase() === studentName?.toLowerCase());
      const classItem = classes.find(c => c.name.toLowerCase() === className?.toLowerCase());

      if (student && classItem) {
        grades.push({
          teacherId,
          studentId: student.id,
          classId: classItem.id,
          subject,
          assessmentName,
          assessmentType: assessmentType || 'nota',
          weight: parseFloat(weight) || 1.0,
          value: parseFloat(value),
          date: new Date(date)
        });
      }
    }

    if (grades.length === 0) {
      return { error: 'Nenhuma nota válida encontrada no CSV' };
    }

    await prisma.grade.createMany({ data: grades });

    revalidatePath('/teacher/assessments');
    revalidatePath('/teacher/reports');
    return { success: true, count: grades.length };
  } catch (err) {
    return { error: 'Erro ao importar notas do CSV' };
  }
}

export async function createBulkClasses(classes: {
  name: string;
  year: number;
  level?: string;
  schoolId?: string;
}[]) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const classData = classes.map(c => ({
      teacherId,
      name: c.name,
      year: c.year,
      level: c.level || null,
      schoolId: c.schoolId || null
    }));

    await prisma.class.createMany({
      data: classData
    });

    revalidatePath('/teacher/students');
    return { success: true, count: classes.length };
  } catch (err) {
    return { error: 'Erro ao criar turmas em lote' };
  }
}

export async function importClassesFromCSV(csvContent: string) {
  const user = await requireTeacher();
  const teacherId = user.id;

  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const classes: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      const [name, year, level] = parts;

      if (name && year) {
        classes.push({
          teacherId,
          name,
          year: parseInt(year),
          level: level || null
        });
      }
    }

    if (classes.length === 0) {
      return { error: 'Nenhuma turma válida encontrada no CSV' };
    }

    await prisma.class.createMany({ data: classes });

    revalidatePath('/teacher/students');
    return { success: true, count: classes.length };
  } catch (err) {
    return { error: 'Erro ao importar turmas do CSV' };
  }
}