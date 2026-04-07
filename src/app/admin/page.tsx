import { prisma } from '@/lib/prisma';
import { Users, CreditCard } from 'lucide-react';

export default async function AdminDashboard() {
  const teachers = await prisma.user.findMany({ where: { role: 'teacher' } });
  const activeTeachers = teachers.filter(t => t.paymentStatus === 'active').length;
  const defaultingTeachers = teachers.filter(t => t.paymentStatus === 'inadimplente').length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard Administrativo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total de Professores</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Pagamentos em Dia</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeTeachers}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Inadimplentes</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{defaultingTeachers}</p>
        </div>
      </div>
    </div>
  );
}
