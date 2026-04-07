'use client';

import { useState, useEffect } from 'react';
import { getTeacherData, createGrade } from '@/actions/teacher';
import { getAssessments, createAssessment, deleteAssessment, publishAssessment, getQuestionBanks, createQuestionBank } from '@/actions/assessments';
import { Plus, CheckSquare, FileText, Users, BookOpen, Trash2, Send, X, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<'grades' | 'online' | 'banks'>('grades');
  const [data, setData] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [questionBanks, setQuestionBanks] = useState<any[]>([]);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [teacherData, assessData, banksData] = await Promise.all([
      getTeacherData(),
      getAssessments(),
      getQuestionBanks()
    ]);
    setData(teacherData);
    setAssessments(assessData || []);
    setQuestionBanks(banksData || []);
  }

  async function handleCreateGrade(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createGrade(formData);
    setIsGradeModalOpen(false);
    loadData();
  }

  async function handleCreateAssessment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createAssessment(formData);
    setIsAssessmentModalOpen(false);
    loadData();
  }

  async function handleCreateBank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createQuestionBank(formData);
    setIsBankModalOpen(false);
    loadData();
  }

  async function handleDeleteAssessment(id: string) {
    if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
      await deleteAssessment(id);
      loadData();
    }
  }

  async function handlePublish(id: string) {
    await publishAssessment(id);
    loadData();
  }

  if (!data) return <div className="p-8">Carregando...</div>;

  const { classes, students, grades } = data;
  const filteredStudents = students.filter((s: any) => s.classId === selectedClass);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'grades' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <CheckSquare className="w-5 h-5" />
          Notas Tradicionais
        </button>
        <button
          onClick={() => setActiveTab('online')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'online' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <FileText className="w-5 h-5" />
          Provas Online
        </button>
        <button
          onClick={() => setActiveTab('banks')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'banks' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <BookOpen className="w-5 h-5" />
          Banco de Questões
        </button>
      </div>

      {activeTab === 'grades' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsGradeModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Lançar Nota
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turma</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aluno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disciplina</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avaliação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                        Nenhuma nota lançada.
                      </td>
                    </tr>
                  ) : (
                    grades?.map((grade: any) => {
                      const cls = classes.find((c: any) => c.id === grade.classId);
                      const std = students.find((s: any) => s.id === grade.studentId);
                      return (
                        <tr key={grade.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(grade.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{std?.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.assessmentName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{grade.value.toFixed(1)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'online' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsAssessmentModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Avaliação
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Nenhuma avaliação online criada.
              </div>
            )}
            {assessments.map((assessment) => (
              <div key={assessment.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{assessment.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    assessment.status === 'published' ? 'bg-green-100 text-green-700' :
                    assessment.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {assessment.status === 'published' ? 'Publicada' : assessment.status === 'draft' ? 'Rascunho' : 'Encerrada'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{assessment.subject}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {assessment._count?.submissions || 0}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {assessment._count?.questions || 0}</span>
                  {assessment.duration && <span>{assessment.duration} min</span>}
                </div>
                <div className="flex gap-2">
                  {assessment.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(assessment.id)}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Publicar
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAssessment(assessment.id)}
                    className="px-3 py-1.5 text-red-600 text-sm border border-red-200 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'banks' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Banco
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questionBanks.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Nenhum banco de questões criado.
              </div>
            )}
            {questionBanks.map((bank) => (
              <div key={bank.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800">{bank.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{bank.subject}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <FileText className="w-3 h-3" />
                  <span>{bank._count?.questions || 0} questões</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isGradeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckSquare className="w-6 h-6 text-blue-600 mr-2" />
              Lançar Nota
            </h2>
            <form onSubmit={handleCreateGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Turma</label>
                <select 
                  name="classId" 
                  required 
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Selecione uma turma...</option>
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Aluno</label>
                <select name="studentId" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" disabled={!selectedClass}>
                  <option value="">Selecione um aluno...</option>
                  {filteredStudents.map((std: any) => (
                    <option key={std.id} value={std.id}>{std.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Disciplina</label>
                <input name="subject" required placeholder="Ex: Matemática" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da Avaliação</label>
                <input name="assessmentName" required placeholder="Ex: Prova 1" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select name="assessmentType" className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="nota">Nota Regular</option>
                    <option value="prova">Prova</option>
                    <option value="trabalho">Trabalho</option>
                    <option value="participacao">Participação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Peso</label>
                  <input name="weight" type="number" step="0.1" min="0.1" defaultValue="1.0" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nota</label>
                  <input name="value" type="number" step="0.1" min="0" max="10" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data</label>
                  <input name="date" type="date" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsGradeModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
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

      {isAssessmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              Nova Avaliação Online
            </h2>
            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input name="title" required placeholder="Ex: Prova de Matemática" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Disciplina</label>
                <input name="subject" required placeholder="Ex: Matemática" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Turma (opcional)</label>
                <select name="classId" className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  <option value="">Todas as turmas</option>
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select name="type" className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="test">Teste</option>
                    <option value="quiz">Quiz</option>
                    <option value="exam">Prova</option>
                    <option value="assignment">Trabalho</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duração (min)</label>
                  <input name="duration" type="number" min="1" placeholder="60" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nota Mínima</label>
                  <input name="passingScore" type="number" step="0.1" min="0" max="10" defaultValue="5" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select name="status" className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                    <option value="draft">Rascunho</option>
                    <option value="published">Publicar agora</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm text-gray-700">
                  <input type="checkbox" name="shuffleQuestions" value="true" className="mr-2" />
                  Embaralhar questões
                </label>
                <label className="flex items-center text-sm text-gray-700">
                  <input type="checkbox" name="shuffleOptions" value="true" className="mr-2" />
                  Embaralhar alternativas
                </label>
                <label className="flex items-center text-sm text-gray-700">
                  <input type="checkbox" name="showResults" value="true" defaultChecked className="mr-2" />
                  Mostrar resultado ao aluno
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Agendar (opcional)</label>
                <input name="scheduledAt" type="datetime-local" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsAssessmentModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBankModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
              Novo Banco de Questões
            </h2>
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input name="name" required placeholder="Ex: Questões Matemática 6º ano" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Disciplina</label>
                <input name="subject" required placeholder="Ex: Matemática" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
                <textarea name="description" placeholder="Descrição do banco..." className="mt-1 block w-full border border-gray-300 rounded-md p-2" rows={3} />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsBankModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}