import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter caractere especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

export const createClassSchema = z.object({
  name: z.string().min(1, 'Nome da turma é obrigatório'),
  school: z.string().min(1, 'Escola é obrigatória'),
  year: z.coerce.number().min(2020).max(2100),
  level: z.string().optional(),
});

export const createStudentSchema = z.object({
  name: z.string().min(1, 'Nome do aluno é obrigatório'),
  classId: z.string().min(1, 'Turma é obrigatória'),
});

export const createGradeSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().min(1),
  subject: z.string().min(1),
  assessmentName: z.string().min(1),
  assessmentType: z.enum(['nota', 'prova', 'trabalho', 'participacao']).default('nota'),
  weight: z.coerce.number().min(0.1).max(10).default(1),
  value: z.coerce.number().min(0).max(10),
  date: z.string().min(1),
});

export const createActivitySchema = z.object({
  classId: z.string().optional(),
  subject: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  activityType: z.string().min(1),
  difficulty: z.enum(['facil', 'medio', 'dificil']).default('medio'),
  content: z.string().optional(),
  answer: z.string().optional(),
  tags: z.string().optional(),
});

export const createLessonSchema = z.object({
  classId: z.string().min(1),
  subject: z.string().min(1),
  theme: z.string().min(1),
  content: z.string().optional(),
  status: z.enum(['planned', 'completed']).optional(),
  date: z.string().min(1),
});

export const createTopicSchema = z.object({
  classId: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  status: z.enum(['not-started', 'in-progress', 'completed']).optional(),
});

export const createMaterialSchema = z.object({
  classId: z.string().optional(),
  subject: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url('URL inválida'),
  type: z.string().min(1),
  category: z.string().optional(),
  tags: z.string().optional(),
});

export const createTeacherSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  school: z.string().min(1),
});

// ==================== NOVOS SCHEMAS ====================

// Mural de Avisos
export const createPostSchema = z.object({
  classId: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  isPinned: z.boolean().optional(),
  attachments: z.string().optional(), // JSON array
});

// Chat
export const sendMessageSchema = z.object({
  toId: z.string().min(1, 'Destinatário é obrigatório'),
  content: z.string().min(1, 'Mensagem é obrigatória'),
  type: z.enum(['direct', 'group', 'broadcast']).default('direct'),
  groupId: z.string().optional(),
});

// Banco de Questões
export const createQuestionBankSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  subject: z.string().min(1, 'Disciplina é obrigatória'),
  description: z.string().optional(),
  tags: z.string().optional(),
});

// Questão
export const createQuestionSchema = z.object({
  bankId: z.string().optional(),
  assessmentId: z.string().optional(),
  type: z.enum(['multiple_choice', 'true_false', 'essay', 'matching']),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  options: z.string().optional(), // JSON array
  correctAnswer: z.string().min(1, 'Resposta correta é obrigatória'),
  points: z.coerce.number().min(0.1).default(1),
  explanation: z.string().optional(),
});

// Avaliação Online
export const createAssessmentSchema = z.object({
  classId: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Disciplina é obrigatória'),
  type: z.enum(['test', 'quiz', 'assignment', 'exam']),
  duration: z.coerce.number().min(1).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  showResults: z.boolean().optional(),
  passingScore: z.coerce.number().min(0).max(10).default(5),
  status: z.enum(['draft', 'published', 'closed']).default('draft'),
  scheduledAt: z.string().optional(),
});

// School
export const createSchoolSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

// AI Chat
export const aiChatSchema = z.object({
  message: z.string().min(1, 'Mensagem é obrigatória'),
  context: z.enum(['reports', 'planning', 'general']).default('general'),
});