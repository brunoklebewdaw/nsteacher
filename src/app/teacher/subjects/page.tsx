'use client';

import { useState, useEffect } from 'react';
import { getTeacherData, getSubjects, saveSubjects } from '@/actions/teacher';
import { getSubjectStats, getClassAverages } from '@/actions/reports';
import { Plus, BookOpen, ChevronRight, Trash2, Edit2, X, Calendar, Users, FileText, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subject {
  id: string;
  name: string;
  series: string;
  description: string;
  objectives: string;
  skills: string;
  classes: string[];
  progress: number;
  status: string;
}

export default function SubjectsPage() {
  const [data, setData] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectStats, setSubjectStats] = useState<Record<string, any>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  useEffect(() => { 
    loadData(); 
  }, []);

  async function loadData() {
    const [teacherData, subs] = await Promise.all([getTeacherData(), getSubjects()]);
    setData(teacherData);
    setSubjects(subs);
    
    const stats: Record<string, any> = {};
    if (teacherData?.classes) {
      for (const cls of teacherData.classes) {
        for (const subject of (teacherData.subjects || [])) {
          if (!stats[subject]) {
            const subjectGrades = teacherData.grades?.filter((g: any) => g.subject === subject) || [];
            const subjectLessons = teacherData.lessons?.filter((l: any) => l.subject === subject) || [];
            const subjectActivities = teacherData.materials?.filter((m: any) => m.subject === subject) || [];
            
            const avg = subjectGrades.length > 0
              ? subjectGrades.reduce((sum: number, g: any) => sum + g.value, 0) / subjectGrades.length
              : null;
            
            const lastLesson = subjectLessons.length > 0 
              ? subjectLessons.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
              : null;
            
            stats[subject] = {
              lessonsCount: subjectLessons.length,
              activitiesCount: subjectActivities.length,
              gradesCount: subjectGrades.length,
              average: avg,
              lastLesson: lastLesson?.date,
              lastActivity: subjectActivities[0]?.createdAt
            };
          }
        }
      }
    }
    setSubjectStats(stats);
  }

  async function handleSaveSubject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSubject: Subject = {
      id: editingSubject?.id || 'sub_' + Date.now(),
      name: formData.get('name') as string,
      series: formData.get('series') as string,
      description: formData.get('description') as string,
      objectives: formData.get('objectives') as string,
      skills: formData.get('skills') as string,
      classes: formData.getAll('classes') as string[],
      progress: editingSubject?.progress || 0,
      status: editingSubject?.status || 'not-started'
    };
    const updatedSubjects = editingSubject 
      ? subjects.map(s => s.id === editingSubject.id ? newSubject : s)
      : [...subjects, newSubject];
    await saveSubjects(JSON.stringify(updatedSubjects));
    setSubjects(updatedSubjects);
    setIsModalOpen(false);
    setEditingSubject(null);
  }

  async function handleDeleteSubject(id: string) {
    if (!confirm('Tem certeza?')) return;
    const updated = subjects.filter(s => s.id !== id);
    await saveSubjects(JSON.stringify(updated));
    setSubjects(updated);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in-progress': return 'Em Andamento';
      default: return 'Não Iniciado';
    }
  }

  function getLastUpdateText(date: string | null | undefined) {
    if (!date) return 'Nunca';
    const d = new Date(date);
    if (isToday(d)) return 'Hoje';
    if (isYesterday(d)) return 'Ontem';
    return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
  }

  function getAverageColor(average: number | null) {
    if (average === null) return 'text-gray-400';
    if (average >= 7) return 'text-green-600';
    if (average >= 5) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getAverageStatus(average: number | null) {
    if (average === null) return null;
    if (average >= 7) return { label: 'Ótimo', color: 'bg-green-100 text-green-700' };
    if (average >= 5) return { label: 'Regular', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Atenção', color: 'bg-red-100 text-red-700' };
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matérias</h1>
          <p className="text-sm text-gray-500">Dashboard das Disciplinas</p>
        </div>
        <button onClick={() => { setEditingSubject(null); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5 mr-2" />Nova Matéria
        </button>
      </div>

      {!data ? <div className="p-8 text-center text-gray-500">Carregando...</div> : subjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma matéria cadastrada</h3>
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />Criar Primeira Matéria
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(subject => {
            const stats = subjectStats[subject.name] || {};
            const avgStatus = getAverageStatus(stats.average);
            
            return (
              <div key={subject.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{subject.name}</h3>
                      <p className="text-sm text-gray-500">{subject.series}</p>
                    </div>
                    <span className={'px-2 py-1 text-xs font-medium rounded-full ' + getStatusColor(subject.status)}>{getStatusLabel(subject.status)}</span>
                  </div>
                  
                  {subject.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{subject.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center text-gray-500 mb-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span className="text-xs">Aulas</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">{stats.lessonsCount || 0}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center text-gray-500 mb-1">
                        <FileText className="w-3 h-3 mr-1" />
                        <span className="text-xs">Notas</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">{stats.gradesCount || 0}</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Média da Turma</span>
                      <span className={`font-bold ${getAverageColor(stats?.average ?? null)}`}>
                        {stats?.average != null ? stats.average.toFixed(1) : '—'}
                      </span>
                    </div>
                    {avgStatus && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${avgStatus.color}`}>
                        {avgStatus.label}
                      </span>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Última aula
                      </span>
                      <span className="text-gray-700">{getLastUpdateText(stats?.lastLesson)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progresso BNCC</span>
                      <span className="font-medium text-gray-900">{subject.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${subject.progress >= 70 ? 'bg-green-500' : subject.progress >= 30 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                        style={{ width: subject.progress + '%' }} 
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {(subject.classes || []).slice(0, 2).map((classId: string) => {
                      const cls = data.classes?.find((c: any) => c.id === classId);
                      return cls ? <span key={classId} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{cls.name}</span> : null;
                    })}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <button onClick={() => { setSelectedSubject(subject); setIsDetailOpen(true); }} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                      Ver Detalhes<ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                    <div className="flex space-x-2">
                      <button onClick={() => { setEditingSubject(subject); setIsModalOpen(true); }} className="p-1 text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteSubject(subject.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingSubject ? 'Editar Matéria' : 'Nova Matéria'}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingSubject(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Matéria *</label>
                  <input name="name" required defaultValue={editingSubject?.name} placeholder="Ex: Matemática" className="w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Série/Ano *</label>
                  <input name="series" required defaultValue={editingSubject?.series} placeholder="Ex: 7º Ano" className="w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea name="description" rows={2} defaultValue={editingSubject?.description} placeholder="Breve descrição..." className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos de Aprendizagem</label>
                <textarea name="objectives" rows={2} defaultValue={editingSubject?.objectives} placeholder="O que o aluno deve aprender..." className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Habilidades/Competências</label>
                <textarea name="skills" rows={2} defaultValue={editingSubject?.skills} placeholder="Habilidades da BNCC..." className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turmas Vinculadas</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {data?.classes?.map((cls: any) => (
                    <label key={cls.id} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" name="classes" value={cls.id} defaultChecked={editingSubject?.classes?.includes(cls.id)} className="rounded" />
                      <span className="text-sm">{cls.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingSubject(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingSubject ? 'Salvar' : 'Criar Matéria'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedSubject.name}</h2>
                <p className="text-gray-500">{selectedSubject.series}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              <div><h3 className="font-semibold text-gray-900 mb-2">Descrição</h3><p className="text-gray-600">{selectedSubject.description || 'Não informada'}</p></div>
              <div><h3 className="font-semibold text-gray-900 mb-2">Objetivos</h3><p className="text-gray-600 whitespace-pre-line">{selectedSubject.objectives || 'Não informados'}</p></div>
              <div><h3 className="font-semibold text-gray-900 mb-2">Habilidades</h3><p className="text-gray-600 whitespace-pre-line">{selectedSubject.skills || 'Não informadas'}</p></div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Turmas</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedSubject.classes || []).length > 0 ? (selectedSubject.classes || []).map((classId: string) => {
                    const cls = data.classes?.find((c: any) => c.id === classId);
                    return cls ? <span key={classId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{cls.name}</span> : null;
                  }) : <span className="text-gray-500">Nenhuma turma</span>}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Progresso</h3>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3"><div className="bg-green-500 h-3 rounded-full" style={{ width: selectedSubject.progress + '%' }} /></div>
                  <span className="font-medium">{selectedSubject.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
