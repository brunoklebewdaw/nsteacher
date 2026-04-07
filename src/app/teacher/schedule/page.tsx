'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTeacherData, createLesson, updateLesson, deleteLesson } from '@/actions/teacher';
import { Calendar, Plus, X, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, Trash2, Edit2, BookOpen, Users, FileText } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SUBJECT_COLORS: Record<string, string> = {
  'Matemática': 'bg-blue-100 border-blue-300 text-blue-800',
  'Português': 'bg-green-100 border-green-300 text-green-800',
  'História': 'bg-amber-100 border-amber-300 text-amber-800',
  'Geografia': 'bg-emerald-100 border-emerald-300 text-emerald-800',
  'Ciências': 'bg-cyan-100 border-cyan-300 text-cyan-800',
  'Física': 'bg-sky-100 border-sky-300 text-sky-800',
  'Química': 'bg-violet-100 border-violet-300 text-violet-800',
  'Biologia': 'bg-teal-100 border-teal-300 text-teal-800',
  'Inglês': 'bg-pink-100 border-pink-300 text-pink-800',
  'Artes': 'bg-rose-100 border-rose-300 text-rose-800',
  'Educação Física': 'bg-orange-100 border-orange-300 text-orange-800',
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || 'bg-gray-100 border-gray-300 text-gray-800';
}

export default function SchedulePage() {
  const [data, setData] = useState<any>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const res = await getTeacherData();
    setData(res);
  }

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const lessonsByDay = useMemo(() => {
    if (!data?.lessons) return {};
    const grouped: Record<string, any[]> = {};
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = data.lessons.filter((l: any) => {
        const lessonDate = new Date(l.date);
        return isSameDay(lessonDate, day);
      }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return grouped;
  }, [data?.lessons, weekDays]);

  const todayLessons = data?.lessons?.filter((l: any) => isToday(new Date(l.date))) || [];
  const todayWithoutPlan = todayLessons.filter((l: any) => !l.theme || !l.objective);
  const weekLessons = Object.values(lessonsByDay).flat();

  async function handleSaveLesson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingLesson) {
      await updateLesson(editingLesson.id, formData);
    } else {
      await createLesson(formData);
    }
    
    setIsModalOpen(false);
    setEditingLesson(null);
    loadData();
  }

  async function handleDeleteLesson(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return;
    await deleteLesson(id);
    setIsModalOpen(false);
    setEditingLesson(null);
    loadData();
  }

  function goToNextWeek() {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  }

  function goToPrevWeek() {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  }

  function goToToday() {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
    setSelectedDate(new Date());
  }

  function getLessonStatus(lesson: any) {
    if (lesson.status === 'completed') return { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    if (lesson.theme && lesson.objective) return { label: 'Planejada', color: 'bg-blue-100 text-blue-700', icon: CheckCircle };
    return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
  }

  function getLessonIndicators(lesson: any) {
    const indicators = [];
    if (lesson.theme && lesson.objective) indicators.push({ icon: '✔', label: 'Planejada', color: 'text-green-600' });
    else indicators.push({ icon: '⚠', label: 'Pendente', color: 'text-yellow-600' });
    if (lesson.content) indicators.push({ icon: '📎', label: 'Com conteúdo', color: 'text-blue-600' });
    if (lesson.activities) indicators.push({ icon: '📋', label: 'Com atividades', color: 'text-purple-600' });
    return indicators;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500">Gerenciamento completo de aulas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'week' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'day' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Dia
            </button>
          </div>
          <button
            onClick={() => { setEditingLesson(null); setIsModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Aula
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl border ${todayLessons.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Aulas Hoje</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{todayLessons.length}</p>
        </div>
        <div className={`p-4 rounded-xl border ${todayWithoutPlan.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Sem Planejamento</span>
            <AlertTriangle className={`w-5 h-5 ${todayWithoutPlan.length > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${todayWithoutPlan.length > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{todayWithoutPlan.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Próxima Aula</span>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          {todayLessons.length > 0 ? (
            <div>
              <p className="font-bold text-gray-900 truncate">{todayLessons[0].subject}</p>
              <p className="text-xs text-gray-500">{format(new Date(todayLessons[0].date), 'HH:mm')}</p>
            </div>
          ) : (
            <p className="text-xl font-bold text-gray-400">—</p>
          )}
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Esta Semana</span>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{weekLessons.length} aulas</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={goToPrevWeek} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
              Hoje
            </button>
            <button onClick={goToNextWeek} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentWeekStart, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>
        </div>

        {viewMode === 'week' ? (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[800px]">
              {weekDays.map((day, idx) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayLessons = lessonsByDay[dayKey] || [];
                const isTodayDay = isToday(day);
                
                return (
                  <div 
                    key={idx} 
                    className={`min-h-[350px] border-r border-gray-100 ${isTodayDay ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`p-3 text-center border-b ${isTodayDay ? 'bg-blue-600' : 'bg-gray-50'}`}>
                      <div className={`text-xs font-medium ${isTodayDay ? 'text-blue-100' : 'text-gray-500'}`}>
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                      <div className={`text-lg font-bold ${isTodayDay ? 'text-white' : 'text-gray-900'}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                    <div className="p-2 space-y-2">
                      {dayLessons.length === 0 ? (
                        <div className="text-center py-4">
                          <button
                            onClick={() => { setSelectedDate(day); setIsModalOpen(true); }}
                            className="text-gray-400 hover:text-blue-600 text-xs"
                          >
                            + Adicionar
                          </button>
                        </div>
                      ) : (
                        dayLessons.map((lesson: any) => {
                          const status = getLessonStatus(lesson);
                          const StatusIcon = status.icon;
                          
                          return (
                            <div
                              key={lesson.id}
                              onClick={() => { setEditingLesson(lesson); setIsModalOpen(true); }}
                              className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all ${getSubjectColor(lesson.subject)}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold">{format(new Date(lesson.date), 'HH:mm')}</span>
                                <StatusIcon className="w-3 h-3" />
                              </div>
                              <div className="text-xs font-semibold truncate">{lesson.subject}</div>
                              <div className="text-xs truncate opacity-80">{lesson.class?.name}</div>
                              {lesson.theme && (
                                <div className="text-xs truncate mt-1 opacity-60 font-medium">{lesson.theme}</div>
                              )}
                              <div className="flex gap-1 mt-1">
                                {getLessonIndicators(lesson).map((ind, i) => (
                                  <span key={i} className={`text-xs ${ind.color}`}>{ind.icon}</span>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4">
            {selectedDate && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <button 
                    onClick={() => {
                      const prevDay = addDays(selectedDate, -1);
                      setSelectedDate(prevDay);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <button 
                    onClick={() => {
                      const nextDay = addDays(selectedDate, 1);
                      setSelectedDate(nextDay);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                {(lessonsByDay[format(selectedDate, 'yyyy-MM-dd')] || []).length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 mb-4">Nenhuma aula nesta data</p>
                    <button
                      onClick={() => { setEditingLesson(null); setIsModalOpen(true); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Criar Aula
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(lessonsByDay[format(selectedDate, 'yyyy-MM-dd')] || []).map((lesson: any) => {
                      const status = getLessonStatus(lesson);
                      const StatusIcon = status.icon;
                      const indicators = getLessonIndicators(lesson);
                      
                      return (
                        <div
                          key={lesson.id}
                          className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start space-x-4">
                              <div className="text-center min-w-[60px]">
                                <div className="text-lg font-bold text-blue-600">{format(new Date(lesson.date), 'HH:mm')}</div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(lesson.subject)}`}>
                                    {lesson.subject}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${status.color}`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {status.label}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-gray-900">{lesson.theme || 'Sem tema definido'}</h4>
                                <p className="text-sm text-gray-500">{lesson.class?.name}</p>
                                
                                {lesson.objective && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                    <p className="text-xs font-medium text-blue-700">Objetivo:</p>
                                    <p className="text-sm text-gray-600">{lesson.objective}</p>
                                  </div>
                                )}
                                
                                {lesson.content && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-medium text-gray-700">Conteúdo:</p>
                                    <p className="text-sm text-gray-600">{lesson.content}</p>
                                  </div>
                                )}
                                
                                {lesson.activities && (
                                  <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                                    <p className="text-xs font-medium text-purple-700">Atividades:</p>
                                    <p className="text-sm text-gray-600">{lesson.activities}</p>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-3 mt-2">
                                  {indicators.map((ind, i) => (
                                    <span key={i} className={`text-sm ${ind.color}`} title={ind.label}>{ind.icon}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => { setEditingLesson(lesson); setIsModalOpen(true); }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLesson ? 'Editar Aula' : 'Nova Aula'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditingLesson(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                  <input 
                    name="date" 
                    type="datetime-local" 
                    required 
                    defaultValue={editingLesson ? format(new Date(editingLesson.date), "yyyy-MM-dd'T'HH:mm") : ''}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Turma *</label>
                  <select name="classId" required defaultValue={editingLesson?.classId} className="w-full border border-gray-300 rounded-md p-2">
                    <option value="">Selecione...</option>
                    {data?.classes?.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina *</label>
                <input 
                  name="subject" 
                  required 
                  defaultValue={editingLesson?.subject || ''}
                  placeholder="Ex: Matemática"
                  list="subjects-list"
                  className="w-full border border-gray-300 rounded-md p-2"
                />
                <datalist id="subjects-list">
                  {data?.subjects?.map((s: string) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tema da Aula *</label>
                <input 
                  name="theme" 
                  required 
                  defaultValue={editingLesson?.theme || ''}
                  placeholder="Ex: Introdução às Frações"
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                <textarea 
                  name="objective" 
                  rows={2}
                  defaultValue={editingLesson?.objective || ''}
                  placeholder="O que o aluno aprenderá nesta aula..."
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                <textarea 
                  name="content" 
                  rows={3}
                  defaultValue={editingLesson?.content || ''}
                  placeholder="Descrição do conteúdo a ser abordado..."
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atividades</label>
                <textarea 
                  name="activities" 
                  rows={2}
                  defaultValue={editingLesson?.activities || ''}
                  placeholder="Atividades propostas para a aula..."
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea 
                  name="observations" 
                  rows={2}
                  defaultValue={editingLesson?.observations || ''}
                  placeholder="Observações adicionais..."
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" defaultValue={editingLesson?.status || 'planned'} className="w-full border border-gray-300 rounded-md p-2">
                  <option value="planned">Planejada</option>
                  <option value="completed">Concluída</option>
                </select>
              </div>
              <div className="flex justify-between pt-4">
                {editingLesson && (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteLesson(editingLesson.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Excluir Aula
                  </button>
                )}
                <div className="flex space-x-3 ml-auto">
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); setEditingLesson(null); }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editingLesson ? 'Salvar Alterações' : 'Criar Aula'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
