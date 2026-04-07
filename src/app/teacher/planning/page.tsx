'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTeacherData, createTopic, updateTopicStatus } from '@/actions/teacher';
import { Plus, BookOpen, CheckCircle, Circle, Clock, ChevronRight, X, AlertTriangle, TrendingUp, GraduationCap, Target, Calendar, Sparkles } from 'lucide-react';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PlanningPage() {
  const [data, setData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setIsModalOpen(true);
    }
  }, []);

  async function loadData() {
    const res = await getTeacherData();
    setData(res);
    if (res?.classes && res.classes.length > 0) {
      setSelectedClass(res.classes[0].id);
    }
  }

  async function handleCreateTopic(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createTopic(formData);
    setIsModalOpen(false);
    loadData();
  }

  const topicsBySubject = useMemo(() => {
    if (!data?.topics) return {};
    const grouped: Record<string, any[]> = {};
    data.topics.forEach((topic: any) => {
      if (!grouped[topic.subject]) {
        grouped[topic.subject] = [];
      }
      grouped[topic.subject].push(topic);
    });
    return grouped;
  }, [data?.topics]);

  const stats = useMemo(() => {
    if (!data?.topics) return { completed: 0, inProgress: 0, notStarted: 0, total: 0 };
    return {
      completed: data.topics.filter((t: any) => t.status === 'completed').length,
      inProgress: data.topics.filter((t: any) => t.status === 'in-progress').length,
      notStarted: data.topics.filter((t: any) => t.status === 'not-started').length,
      total: data.topics.length
    };
  }, [data?.topics]);

  function getStatusInfo(status: string) {
    switch (status) {
      case 'completed':
        return { label: 'Concluído', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' };
      case 'in-progress':
        return { label: 'Em Andamento', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' };
      default:
        return { label: 'Não Iniciado', icon: Circle, color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
    }
  }

  function getTopicProgress(topic: any) {
    const topicLessons = data?.lessons?.filter((l: any) => l.theme?.includes(topic.topic)) || [];
    return topicLessons.length;
  }

  function getAIAutopic() {
    const suggestions = [
      { topic: 'EF01LP01 - Leitura', subject: 'Português', classId: selectedClass },
      { topic: 'EF01MA01 - Números', subject: 'Matemática', classId: selectedClass },
      { topic: 'EF01CI01 - Seres Vivos', subject: 'Ciências', classId: selectedClass },
      { topic: 'EF01HI01 - Tempo', subject: 'História', classId: selectedClass },
      { topic: 'EF01GE01 - Lugar', subject: 'Geografia', classId: selectedClass },
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  if (!data) return <div className="p-8">Carregando...</div>;

  const { classes, topics, subjects } = data;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planejamento BNCC</h1>
          <p className="text-sm text-gray-500">Timeline de Ensino</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAiSuggestion(!showAiSuggestion)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            IA Sugerir
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Tópico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total de Tópicos</span>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Concluídos</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-700">Em Andamento</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-700">{stats.inProgress}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Não Iniciados</span>
            <Circle className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-700">{stats.notStarted}</p>
        </div>
      </div>

      {showAiSuggestion && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-purple-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Sugestão de IA
            </h3>
            <button onClick={() => setShowAiSuggestion(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-600 mb-3">
              Baseado no seu progresso atual, sugerimos adicionar:
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{getAIAutopic().topic}</p>
                <p className="text-sm text-gray-500">{getAIAutopic().subject}</p>
              </div>
              <button
                onClick={async () => {
                  const suggestion = getAIAutopic();
                  const formData = new FormData();
                  formData.append('classId', suggestion.classId);
                  formData.append('subject', suggestion.subject);
                  formData.append('topic', suggestion.topic);
                  formData.append('status', 'not-started');
                  await createTopic(formData);
                  setShowAiSuggestion(false);
                  loadData();
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Turma</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">Todas as Turmas</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Disciplina</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="">Todas as Disciplinas</option>
              {subjects?.map((subj: string) => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {Object.keys(topicsBySubject).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum tópico cadastrado</h3>
          <p className="text-sm text-gray-500 mb-4">Comece a planejar suas aulas adicionando tópicos da BNCC</p>
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />Criar Primeiro Tópico
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(topicsBySubject).map(([subject, subjectTopics]: [string, any]) => {
            const filteredTopics = subjectTopics.filter((t: any) => {
              if (selectedClass && t.classId !== selectedClass) return false;
              if (selectedSubject && t.subject !== selectedSubject) return false;
              return true;
            });

            if (filteredTopics.length === 0) return null;

            return (
              <div key={subject} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                    {subject}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-4">
                      {filteredTopics.map((topic: any, idx: number) => {
                        const statusInfo = getStatusInfo(topic.status);
                        const StatusIcon = statusInfo.icon;
                        const lessonCount = getTopicProgress(topic);
                        const cls = classes.find((c: any) => c.id === topic.classId);
                        
                        return (
                          <div key={topic.id} className="relative flex items-start ml-2">
                            <div className={`absolute left-2 w-4 h-4 rounded-full ${statusInfo.dot} border-2 border-white z-10`}></div>
                            <div className="ml-10 flex-1">
                              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                        <StatusIcon className="w-3 h-3 inline mr-1" />
                                        {statusInfo.label}
                                      </span>
                                      {cls && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                          {cls.name}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="font-semibold text-gray-900">{topic.topic}</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {topic.class?.name}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Aulas</p>
                                      <p className="text-lg font-bold text-gray-900">{lessonCount}</p>
                                    </div>
                                    <select
                                      value={topic.status}
                                      onChange={async (e) => {
                                        await updateTopicStatus(topic.id, e.target.value);
                                        loadData();
                                      }}
                                      className="text-sm rounded-lg px-3 py-2 border border-gray-300 bg-white cursor-pointer"
                                    >
                                      <option value="not-started">Não Iniciado</option>
                                      <option value="in-progress">Em Andamento</option>
                                      <option value="completed">Concluído</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
              Novo Tópico do Currículo
            </h2>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Turma</label>
                <select name="classId" required className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  <option value="">Selecione uma turma...</option>
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Disciplina</label>
                <input name="subject" required placeholder="Ex: Matemática" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tópico (Código BNCC ou Descrição)</label>
                <input name="topic" required placeholder="Ex: EF06MA01 - Frações" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status Inicial</label>
                <select name="status" className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  <option value="not-started">Não Iniciado</option>
                  <option value="in-progress">Em Andamento</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
