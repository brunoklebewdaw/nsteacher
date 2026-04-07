'use client';

import { useState, useEffect } from 'react';
import { getTeachers, createTeacher, togglePaymentStatus, toggleBlocked, deleteTeacher, toggleActive } from '@/actions/admin';
import { Plus, Search, MoreVertical, ShieldAlert, CheckCircle, Trash2, Ban, Unlock, UserCheck, UserX } from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    const data = await getTeachers();
    setTeachers(data);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const res = await createTeacher(formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setIsModalOpen(false);
      loadTeachers();
    }
    setLoading(false);
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Professores</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Professor
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escola</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.school}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    !teacher.active ? 'bg-yellow-100 text-yellow-800' :
                    teacher.blocked ? 'bg-red-100 text-red-800' : 
                    teacher.paymentStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {!teacher.active ? 'Pendente' : teacher.blocked ? 'Bloqueado' : teacher.paymentStatus === 'active' ? 'Ativo' : 'Inadimplente'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={async () => {
                      await toggleActive(teacher.id);
                      loadTeachers();
                    }}
                    className={`mr-4 ${teacher.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                    title={teacher.active ? 'Desativar' : 'Ativar'}
                  >
                    {teacher.active ? <UserX className="w-4 h-4 inline" /> : <UserCheck className="w-4 h-4 inline" />}
                    {teacher.active ? ' Desativar' : ' Ativar'}
                  </button>
                  <button
                    onClick={async () => {
                      await toggleBlocked(teacher.id, teacher.blocked || false);
                      loadTeachers();
                    }}
                    className={`mr-4 ${teacher.blocked ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'}`}
                    title={teacher.blocked ? 'Desbloquear' : 'Bloquear'}
                  >
                    {teacher.blocked ? <Unlock className="w-4 h-4 inline" /> : <Ban className="w-4 h-4 inline" />}
                    {teacher.blocked ? ' Desbloquear' : ' Bloquear'}
                  </button>
                  <button
                    onClick={async () => {
                      await togglePaymentStatus(teacher.id, teacher.paymentStatus);
                      loadTeachers();
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    {teacher.paymentStatus === 'active' ? 'Inadimplente' : 'Ativo'}
                  </button>
                  <button
                    onClick={async () => {
                      await deleteTeacher(teacher.id);
                      loadTeachers();
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Novo Professor</h2>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input name="name" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input name="password" type="password" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Escola</label>
                <input name="school" required className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
