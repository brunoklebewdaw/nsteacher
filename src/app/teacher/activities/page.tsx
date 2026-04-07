'use client';

import { useState, useEffect } from 'react';
import { getActivities, createActivity, deleteActivity, duplicateActivity } from '@/actions/activities';
import { getTeacherData } from '@/actions/teacher';
import { Plus, Search, Trash2, Copy, Tag, BookOpen, Filter } from 'lucide-react';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [activitiesData, teacherData] = await Promise.all([
      getActivities(filterSubject || undefined, undefined, filterType || undefined),
      getTeacherData()
    ]);
    setActivities(activitiesData || []);
    setClasses(teacherData?.classes || []);
    setSubjects(teacherData?.subjects || []);
  }

  useEffect(() => {
    loadData();
  }, [filterSubject, filterType]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await createActivity(formData);
    if (result.success) {
      setIsModalOpen(false);
      loadData();
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
      await deleteActivity(id);
      loadData();
    }
  }

  async function handleDuplicate(id: string) {
    await duplicateActivity(id);
    loadData();
  }

  const filteredActivities = activities.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activityTypes = ['exercicio', 'trabalho', 'prova', 'pesquisa', 'outro'];
  const difficulties = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
  const colors = { exercicio: 'bg-blue-100 text-blue-700', trabalho: 'bg-green-100 text-green-700', prova: 'bg-red-100 text-red-700', pesquisa: 'bg-purple-100 text-purple-700', outro: 'bg-gray-100 text-gray-700' };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Banco de Atividades</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Atividade
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar atividade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Todas as disciplinas</option>
            {(subjects as string[]).map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Todos os tipos</option>
            {activityTypes.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.map((activity) => (
          <div key={activity.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${colors[activity.activityType as keyof typeof colors]}`}>
                {activity.activityType}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${activity.difficulty === 'facil' ? 'bg-green-100 text-green-700' : activity.difficulty === 'dificil' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {difficulties[activity.difficulty as keyof typeof difficulties]}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{activity.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{activity.description || 'Sem descrição'}</p>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              <span className="flex items-center"><BookOpen className="w-4 h-4 mr-1" />{activity.subject}</span>
              {activity.class && <span className="px-2 py-0.5 bg-gray-100 rounded">{activity.class.name}</span>}
            </div>
            {activity.tags && (
              <div className="flex flex-wrap gap-1 mb-3">
                {activity.tags.split(',').map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button 
                onClick={() => handleDuplicate(activity.id)}
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplicar
              </button>
              <button 
                onClick={() => handleDelete(activity.id)}
                className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filteredActivities.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma atividade encontrada.</p>
            <button onClick={() => setIsModalOpen(true)} className="mt-4 text-green-600 hover:underline">
              Criar primeira atividade
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nova Atividade</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título *</label>
                <input name="title" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Disciplina *</label>
                <select name="subject" required className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  <option value="">Selecione...</option>
                  {(subjects as string[]).map((s: string) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo *</label>
                  <select name="activityType" required className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    {activityTypes.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dificuldade</label>
                  <select name="difficulty" className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="facil">Fácil</option>
                    <option value="medio" selected>Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Turma (opcional)</label>
                <select name="classId" className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  <option value="">Todas as turmas</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea name="description" rows={2} className="mt-1 block w-full border border-gray-300 rounded-md p-2"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
                <textarea name="content" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md p-2"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gabarito (opcional)</label>
                <textarea name="answer" rows={2} className="mt-1 block w-full border border-gray-300 rounded-md p-2"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags (separadas por vírgula)</label>
                <input name="tags" placeholder="Ex: fração, geometria, básico" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
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