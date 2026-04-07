'use client';

import { useState, useEffect } from 'react';
import { getTeacherData, createMaterial, deleteMaterial } from '@/actions/teacher';
import { Plus, FileText, Video, Image, Link as LinkIcon, Trash2, ExternalLink, X, Search, Grid, List } from 'lucide-react';

const MATERIAL_TYPES = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'image', label: 'Imagem', icon: Image },
  { value: 'link', label: 'Link', icon: LinkIcon },
  { value: 'slide', label: 'Slide', icon: FileText },
];

const CATEGORIES = ['Atividades', 'Slides', 'Provas', 'Revisão', 'Exercícios', 'Aulas'];

export default function MaterialsPage() {
  const [data, setData] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const teacherData = await getTeacherData();
    setData(teacherData);
    setMaterials(teacherData?.materials || []);
  }

  async function handleCreateMaterial(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createMaterial(formData);
    setIsModalOpen(false);
    loadData();
  }

  async function handleDeleteMaterial(id: string) {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;
    await deleteMaterial(id);
    loadData();
  }

  const filteredMaterials = materials.filter(m => {
    if (filterSubject && m.subject !== filterSubject) return false;
    if (filterType && m.type !== filterType) return false;
    if (filterCategory && m.category !== filterCategory) return false;
    if (searchTerm && !m.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const subjects = Array.from(new Set(materials.map(m => m.subject)));

  function getTypeIcon(type: string) {
    const typeInfo = MATERIAL_TYPES.find(t => t.value === type);
    const Icon = typeInfo?.icon || FileText;
    return <Icon className="w-5 h-5" />;
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-600';
      case 'video': return 'bg-purple-100 text-purple-600';
      case 'image': return 'bg-green-100 text-green-600';
      case 'link': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Materiais</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5 mr-2" />Novo Material
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar materiais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Todas as Matérias</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Todos os Tipos</option>
            {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Todas as Categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={'px-3 py-2 ' + (viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600')}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={'px-3 py-2 ' + (viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600')}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {!data ? (
        <div className="p-8 text-center text-gray-500">Carregando...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum material encontrado</h3>
          <p className="text-gray-500 mb-4">Adicione materiais para usar em suas aulas.</p>
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />Adicionar Primeiro Material
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMaterials.map(material => (
            <div key={material.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={'p-2 rounded-lg ' + getTypeColor(material.type)}>
                  {getTypeIcon(material.type)}
                </div>
                <button onClick={() => handleDeleteMaterial(material.id)} className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{material.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{material.subject}</p>
              {material.category && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded mb-2">
                  {material.category}
                </span>
              )}
              {material.tags && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {material.tags.split(',').map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{tag.trim()}</span>
                  ))}
                </div>
              )}
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full mt-3 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Acessar
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matéria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMaterials.map(material => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className={'p-2 rounded-lg w-fit ' + getTypeColor(material.type)}>
                      {getTypeIcon(material.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a href={material.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-blue-600">
                      {material.title}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{material.subject}</td>
                  <td className="px-6 py-4">
                    {material.category && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{material.category}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteMaterial(material.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Novo Material</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input name="title" required placeholder="Nome do material" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select name="type" required className="w-full border border-gray-300 rounded-md p-2">
                    {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select name="category" className="w-full border border-gray-300 rounded-md p-2">
                    <option value="">Selecione...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matéria *</label>
                <input name="subject" required placeholder="Ex: Matemática" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input name="url" required type="url" placeholder="https://..." className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
                <input name="tags" placeholder="frações, prova, revisão" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea name="description" rows={2} placeholder="Descrição opcional..." className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turma (opcional)</label>
                <select name="classId" className="w-full border border-gray-300 rounded-md p-2">
                  <option value="">Todas as turmas</option>
                  {data?.classes?.map((cls: any) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar Material</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}