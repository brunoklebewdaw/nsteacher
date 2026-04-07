'use client';

import { useState, useEffect } from 'react';
import { getTeacherData, createClass, createStudent, deleteStudent, updateStudentStatus, importStudents } from '@/actions/teacher';
import { Plus, Search, MoreVertical, Trash2, Users, GraduationCap, TrendingUp, AlertTriangle, Clock, CheckCircle, X, Edit2, Mail, FileText, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportStudentsToCSV, exportClassesToCSV } from '@/lib/export-utils';
import ImportStudentsModal from '@/components/teacher/ImportStudentsModal';

export default function StudentsPage() {
  const [data, setData] = useState<any>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const res = await getTeacherData();
    setData(res);
    if (res?.classes && res.classes.length > 0) {
      setSelectedClass(res.classes[0].id);
    }
  }

  async function handleCreateClass(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createClass(formData);
    setIsClassModalOpen(false);
    loadData();
  }

  async function handleCreateStudent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createStudent(formData);
    setIsStudentModalOpen(false);
    loadData();
  }

  async function handleDeleteStudent(id: string) {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    await deleteStudent(id);
    loadData();
  }

  async function handleUpdateStudentStatus(id: string, status: string) {
    await updateStudentStatus(id, status);
    loadData();
  }

  if (!data) return <div className="p-8">Carregando...</div>;

  const { classes, students, grades } = data;

  const classStats = classes.map((cls: any) => {
    const classStudents = students.filter((s: any) => s.classId === cls.id);
    const classGrades = grades.filter((g: any) => g.classId === cls.id);
    const avg = classGrades.length > 0
      ? classGrades.reduce((sum: number, g: any) => sum + g.value, 0) / classGrades.length
      : null;
    const studentsAtRisk = classStudents.filter((s: any) => s.status === 'at-risk').length;
    const lowGrades = classGrades.filter((g: any) => g.value < 5).length;

    return {
      ...cls,
      studentCount: classStudents.length,
      average: avg,
      studentsAtRisk,
      lowGrades
    };
  });

  const filteredStudents = students.filter((s: any) => {
    if (selectedClass && s.classId !== selectedClass) return false;
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const selectedClassData = classStats.find((c: any) => c.id === selectedClass);

  function getStudentAverage(studentId: string): number | null {
    const studentGrades = grades.filter((g: any) => g.studentId === studentId);
    if (studentGrades.length === 0) return null;
    return studentGrades.reduce((sum: number, g: any) => sum + g.value, 0) / studentGrades.length;
  }

  function getStudentStatus(studentId: string, avg: number | null) {
    if (avg === null) return { label: 'Sem notas', color: 'bg-gray-100 text-gray-700' };
    if (avg >= 7) return { label: 'Ótimo', color: 'bg-green-100 text-green-700' };
    if (avg >= 5) return { label: 'Regular', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Em risco', color: 'bg-red-100 text-red-700' };
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turmas e Alunos</h1>
          <p className="text-sm text-gray-500">Gerenciamento e Métricas</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <button
            onClick={() => exportStudentsToCSV(filteredStudents)}
            className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
          >
            <Upload className="w-5 h-5 mr-2" />
            Importar
          </button>
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Turma
          </button>
          <button
            onClick={() => setIsStudentModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Aluno
          </button>
        </div>
      </div>

      {selectedClassData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Alunos</span>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{selectedClassData.studentCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Média da Turma</span>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className={`text-2xl font-bold ${selectedClassData.average !== null && selectedClassData.average >= 7 ? 'text-green-600' : selectedClassData.average !== null && selectedClassData.average >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
              {selectedClassData.average !== null ? selectedClassData.average.toFixed(1) : '—'}
            </p>
          </div>
          <div className={`p-4 rounded-xl border ${selectedClassData.studentsAtRisk > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Alunos em Risco</span>
              <AlertTriangle className={`w-5 h-5 ${selectedClassData.studentsAtRisk > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <p className={`text-2xl font-bold ${selectedClassData.studentsAtRisk > 0 ? 'text-red-600' : 'text-gray-900'}`}>{selectedClassData.studentsAtRisk}</p>
          </div>
          <div className={`p-4 rounded-xl border ${selectedClassData.lowGrades > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Notas Baixas</span>
              <FileText className={`w-5 h-5 ${selectedClassData.lowGrades > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
            </div>
            <p className={`text-2xl font-bold ${selectedClassData.lowGrades > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{selectedClassData.lowGrades}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Minhas Turmas</h2>
          {classStats.map((cls: any) => (
            <div 
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${
                selectedClass === cls.id 
                  ? 'border-blue-500 ring-2 ring-blue-100' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.school} • {cls.year}º Ano</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {cls.studentCount} alunos
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500">Média</p>
                  <p className={`font-bold ${cls.average !== null && cls.average >= 7 ? 'text-green-600' : cls.average !== null && cls.average >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {cls.average !== null ? cls.average.toFixed(1) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Em risco</p>
                  <p className={`font-bold ${cls.studentsAtRisk > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {cls.studentsAtRisk}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Notas &lt; 5</p>
                  <p className={`font-bold ${cls.lowGrades > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {cls.lowGrades}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Alunos {selectedClassData ? `- ${selectedClassData.name}` : ''}</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aluno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turma</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Média</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student: any) => {
                    const cls = classes.find((c: any) => c.id === student.classId);
                    const avg = getStudentAverage(student.id);
                    const status = getStudentStatus(student.id, avg);
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${avg !== null && avg >= 7 ? 'text-green-600' : avg !== null && avg >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {avg !== null ? avg.toFixed(1) : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleUpdateStudentStatus(student.id, student.status === 'at-risk' ? 'active' : 'at-risk')}
                            className={`p-1 mr-2 ${student.status === 'at-risk' ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                            title={student.status === 'at-risk' ? 'Marcar como OK' : 'Marcar como em risco'}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nova Turma</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da Turma</label>
                <input name="name" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ex: 7º Ano A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ano</label>
                <input name="year" type="number" required min="1" max="9" className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ex: 7" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nível</label>
                <select name="level" required className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  <option value="Fundamental">Fundamental</option>
                  <option value="Ensino Médio">Ensino Médio</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsClassModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
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

      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Novo Aluno</h2>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Aluno</label>
                <input name="name" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Turma</label>
                <select name="classId" required className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                  {data.classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
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

      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importStudents}
        classes={classes}
      />
    </div>
  );
}
