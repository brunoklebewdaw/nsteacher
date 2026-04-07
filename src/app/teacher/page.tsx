'use client';

import { useState, useEffect } from 'react';
import { getTeacherData } from '@/actions/teacher';
import { getSubjectStats, getClassAverages } from '@/actions/reports';
import { generateAlerts } from '@/actions/alerts';
import { Calendar, BookOpen, Users, AlertCircle, TrendingUp, BarChart3, Clock, Plus, ChevronRight, AlertTriangle, CheckCircle, BookMarked, ClipboardList, GraduationCap, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function SimpleBarChart({ data, title }: { data: { label: string; value: number }[]; title: string }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h4 className="text-sm font-medium text-gray-600 mb-3">{title}</h4>
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              style={{ height: `${(item.value / maxValue) * 100}px` }}
            />
            <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceGauge({ value, label }: { value: number | null; label: string }) {
  const percentage = value !== null ? Math.min(100, Math.max(0, value * 10)) : 0;
  const color = value === null ? '#9CA3AF' : value >= 7 ? '#10B981' : value >= 5 ? '#F59E0B' : '#EF4444';
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>{value !== null ? value.toFixed(1) : '—'}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    setWeekDays(days);
  }, []);

  async function loadData() {
    const res = await getTeacherData();
    setData(res);
    if (res?.classes && res.classes.length > 0) {
      setSelectedClass(res.classes[0].id);
    }
    
    const newAlerts = await generateAlerts(res?.classes?.[0]?.teacherId || '');
    setAlerts(newAlerts);
  }

  useEffect(() => {
    if (selectedClass && data?.subjects) {
      loadChartData();
    }
  }, [selectedClass]);

  async function loadChartData() {
    const subjects = data.subjects || [];
    if (subjects.length === 0) return;

    const stats = await Promise.all(
      subjects.slice(0, 4).map(async (subject: string) => {
        const stat = await getSubjectStats(selectedClass, subject);
        return { subject, stat };
      })
    );
    setChartData(stats);
  }

  if (!data) return <div className="p-8">Carregando...</div>;

  const { classes, students, lessons, topics, grades, subjects, userName, accessExpiresAt } = data;

  const getExpireWarning = () => {
    if (!accessExpiresAt) return null;
    const now = new Date();
    const expires = new Date(accessExpiresAt);
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 3 && daysLeft > 0) {
      return { daysLeft, type: 'warning' };
    } else if (daysLeft <= 0) {
      return { daysLeft, type: 'expired' };
    }
    return null;
  };

  const expireWarning = getExpireWarning();

  const pendingTopics = topics.filter((t: any) => t.status !== 'completed').length;
  
  const classGrades = grades.filter((g: any) => g.classId === selectedClass);
  const classAverage = classGrades.length > 0 
    ? classGrades.reduce((sum: number, g: any) => sum + g.value, 0) / classGrades.length 
    : null;

  const gradeDistribution = [
    { label: '0-2', value: classGrades.filter((g: any) => g.value < 2).length },
    { label: '2-5', value: classGrades.filter((g: any) => g.value >= 2 && g.value < 5).length },
    { label: '5-7', value: classGrades.filter((g: any) => g.value >= 5 && g.value < 7).length },
    { label: '7-9', value: classGrades.filter((g: any) => g.value >= 7 && g.value < 9).length },
    { label: '9-10', value: classGrades.filter((g: any) => g.value >= 9).length },
  ];

  const todayLessons = lessons.filter((l: any) => isToday(new Date(l.date)));
  const tomorrowLessons = lessons.filter((l: any) => isTomorrow(new Date(l.date)));
  const upcomingLessons = lessons.filter((l: any) => new Date(l.date) > new Date()).slice(0, 5);

  const lessonsWithoutPlan = todayLessons.filter((l: any) => !l.theme || !l.objective);
  const studentsAtRisk = students.filter((s: any) => s.status === 'at-risk').length;
  const lowGrades = classGrades.filter((g: any) => g.value < 5).length;

  function getLessonTime(date: string) {
    const d = new Date(date);
    return format(d, 'HH:mm');
  }

  function getDayLabel(date: Date) {
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, 'EEE', { locale: ptBR });
  }

  function getAlertBadge(type: string) {
    switch (type) {
      case 'alert': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>Alerta</span>;
      case 'warning': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>Atenção</span>;
      case 'success': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1"/>OK</span>;
      default: return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center">Info</span>;
    }
  }

  return (
    <div className="p-4 md:p-8">
      {expireWarning && (
        <div className={`mb-6 p-4 rounded-xl border ${
          expireWarning.type === 'expired' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-6 h-6 ${expireWarning.type === 'expired' ? 'text-red-600' : 'text-yellow-600'}`} />
            <div>
              <p className={`font-semibold ${expireWarning.type === 'expired' ? 'text-red-800' : 'text-yellow-800'}`}>
                {expireWarning.type === 'expired' 
                  ? 'Seu acesso expirou!' 
                  : `Seu plano expira em ${expireWarning.daysLeft} dia${expireWarning.daysLeft > 1 ? 's' : ''}`}
              </p>
              <p className="text-sm text-gray-600">
                {expireWarning.type === 'expired' 
                  ? 'Entre em contato para renovar seu plano.' 
                  : 'Renove agora para continuar com acesso integral.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white">
        <h2 className="text-2xl font-bold">Olá, {userName}!</h2>
        <p className="text-blue-100 mt-1">Bem-vindo de volta ao NSteacher</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Central do Dia</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/teacher/schedule?action=new" className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Aula
          </Link>
          <Link href="/teacher/assessments?action=new" className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            <ClipboardList className="w-4 h-4 mr-2" />
            Lançar Notas
          </Link>
          <Link href="/teacher/planning?action=new" className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
            <Target className="w-4 h-4 mr-2" />
            Novo Tópico
          </Link>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-orange-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Atenção
            </h3>
            <span className="text-sm text-orange-700">{alerts.length} alerta(s)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {alerts.slice(0, 6).map((alert, idx) => (
              <Link 
                key={idx} 
                href={alert.link || '#'}
                className="flex items-center p-2 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition-colors"
              >
                {getAlertBadge(alert.type)}
                <span className="ml-2 text-sm text-gray-700 truncate">{alert.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Aulas Hoje</h3>
            <div className={`p-2 rounded-lg ${todayLessons.length > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{todayLessons.length}</p>
          {lessonsWithoutPlan.length > 0 && (
            <p className="text-xs text-red-600 mt-1">{lessonsWithoutPlan.length} sem planejamento</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Próxima Aula</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          {upcomingLessons.length > 0 ? (
            <div>
              <p className="text-lg font-bold text-gray-900 truncate">{upcomingLessons[0].subject}</p>
              <p className="text-xs text-gray-500">{getLessonTime(upcomingLessons[0].date)} - {upcomingLessons[0].class?.name}</p>
            </div>
          ) : (
            <p className="text-lg font-bold text-gray-400">—</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Alunos em Risco</h3>
            <div className={`p-2 rounded-lg ${studentsAtRisk > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${studentsAtRisk > 0 ? 'text-red-600' : 'text-gray-900'}`}>{studentsAtRisk}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Notas Baixas</h3>
            <div className={`p-2 rounded-lg ${lowGrades > 0 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${lowGrades > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{lowGrades}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Agenda da Semana
            </h3>
            <Link href="/teacher/schedule" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              Ver agenda <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const dayLessons = lessons.filter((l: any) => isWithinInterval(new Date(l.date), { start: startOfWeek(day, { weekStartsOn: 0 }), end: endOfWeek(day, { weekStartsOn: 0 }) }) && new Date(l.date).toDateString() === day.toDateString());
              const hasLessons = dayLessons.length > 0;
              const isTodayDay = isToday(day);
              
              return (
                <div 
                  key={idx} 
                  className={`p-2 rounded-lg text-center ${
                    isTodayDay 
                      ? 'bg-blue-600 text-white' 
                      : hasLessons 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${isTodayDay ? 'text-blue-100' : 'text-gray-500'}`}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-bold ${isTodayDay ? 'text-white' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                  {hasLessons && (
                    <div className={`mt-1 text-xs font-medium ${isTodayDay ? 'text-blue-100' : 'text-blue-600'}`}>
                      {dayLessons.length} aula{dayLessons.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            {todayLessons.length > 0 ? (
              todayLessons.map((lesson: any) => (
                <div key={lesson.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-16 text-center">
                    <span className="text-sm font-bold text-blue-600">{getLessonTime(lesson.date)}</span>
                  </div>
                  <div className="flex-1 ml-3">
                    <p className="font-medium text-gray-900">{lesson.subject}</p>
                    <p className="text-sm text-gray-500">{lesson.class?.name} • {lesson.theme || 'Sem tema'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {lesson.theme ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Planejada</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pendente</span>
                    )}
                    <Link href={`/teacher/schedule?edit=${lesson.id}`} className="p-1 text-gray-400 hover:text-blue-600">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma aula hoje</p>
                <Link href="/teacher/schedule?action=new" className="text-blue-600 hover:text-blue-700 text-sm">
                  Criar nova aula
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            Planejamento
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <BookMarked className="w-5 h-5 text-green-500 mr-3" />
                <span className="text-sm text-gray-700">Concluídos</span>
              </div>
              <span className="font-bold text-green-600">{topics.filter((t: any) => t.status === 'completed').length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="text-sm text-gray-700">Em Andamento</span>
              </div>
              <span className="font-bold text-yellow-600">{topics.filter((t: any) => t.status === 'in-progress').length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-700">Não Iniciados</span>
              </div>
              <span className="font-bold text-gray-600">{pendingTopics}</span>
            </div>
          </div>

          <Link href="/teacher/planning" className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Ver Planejamento
          </Link>
        </div>
      </div>

      {classes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-900">Desempenho por Turma</h3>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <PerformanceGauge value={classAverage} label="Média da Turma" />
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total de Notas</div>
              <div className="text-2xl font-bold text-gray-900">{classGrades.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Acima de 7</div>
              <div className="text-2xl font-bold text-green-600">
                {classGrades.filter((g: any) => g.value >= 7).length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Abaixo de 5</div>
              <div className="text-2xl font-bold text-red-600">
                {classGrades.filter((g: any) => g.value < 5).length}
              </div>
            </div>
          </div>

          <SimpleBarChart 
            data={gradeDistribution} 
            title="Distribuição de Notas" 
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo por Disciplina</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(subjects || []).map((subject: string) => {
            const subjectGrades = grades.filter((g: any) => g.subject === subject);
            const subjectLessons = lessons.filter((l: any) => l.subject === subject);
            const avg = subjectGrades.length > 0 
              ? subjectGrades.reduce((s: number, g: any) => s + g.value, 0) / subjectGrades.length 
              : null;
            
            return (
              <Link key={subject} href={`/teacher/subjects`} className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
                <div className="font-medium text-gray-900 mb-1">{subject}</div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">{subjectLessons.length} aulas</span>
                  <span className="text-gray-500">{subjectGrades.length} notas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-semibold ${avg !== null && avg >= 7 ? 'text-green-600' : avg !== null && avg >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {avg !== null ? avg.toFixed(1) : '—'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            );
          })}
          {(!subjects || subjects.length === 0) && (
            <p className="text-gray-500 col-span-3">Nenhuma disciplina cadastrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
