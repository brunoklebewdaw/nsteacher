'use client';

import { useState, useEffect } from 'react';
import { getAnalyticsDashboard, getStudentAnalytics } from '@/actions/ai';
import { BarChart3, TrendingUp, AlertTriangle, Star, Users, FileText, BookOpen } from 'lucide-react';

interface AnalyticsData {
  totalClasses: number;
  totalStudents: number;
  totalGrades: number;
  studentStats: any[];
  atRiskStudents: any[];
  excellentStudents: any[];
  subjectStats: any[];
  gradeDistribution: { '0-4': number; '4-6': number; '6-8': number; '8-10': number };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    const result = await getAnalyticsDashboard();
    setData(result);
    setLoading(false);
  }

  async function handleSelectStudent(studentId: string) {
    setSelectedStudent(studentId);
    const result = await getStudentAnalytics(studentId);
    setStudentData(result);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-gray-500">Erro ao carregar dados</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Analytics Educacional</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Users className="w-5 h-5" />
            <span>Total de Alunos</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{data.totalStudents}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <BookOpen className="w-5 h-5" />
            <span>Total de Turmas</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{data.totalClasses}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <FileText className="w-5 h-5" />
            <span>Total de Notas</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{data.totalGrades}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 text-yellow-500 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Alunos em Risco</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{data.atRiskStudents.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Distribuição de Notas
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600">0-4 (Insuficiente)</span>
                <span className="text-gray-600">{data.gradeDistribution['0-4']} notas</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${(data.gradeDistribution['0-4'] / data.totalGrades) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-600">4-6 (Regular)</span>
                <span className="text-gray-600">{data.gradeDistribution['4-6']} notas</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: `${(data.gradeDistribution['4-6'] / data.totalGrades) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-600">6-8 (Bom)</span>
                <span className="text-gray-600">{data.gradeDistribution['6-8']} notas</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${(data.gradeDistribution['6-8'] / data.totalGrades) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600">8-10 (Excelente)</span>
                <span className="text-gray-600">{data.gradeDistribution['8-10']} notas</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${(data.gradeDistribution['8-10'] / data.totalGrades) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Médias por Disciplina
          </h3>
          <div className="space-y-3">
            {data.subjectStats.map((stat) => (
              <div key={stat.subject} className="flex justify-between items-center">
                <span className="text-gray-700">{stat.subject}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${parseFloat(stat.average) >= 7 ? 'text-green-600' : parseFloat(stat.average) >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {stat.average}
                  </span>
                  <span className="text-xs text-gray-400">({stat.totalGrades})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Alunos em Risco (Média &lt; 5)
          </h3>
          {data.atRiskStudents.length === 0 ? (
            <p className="text-gray-500">Nenhum aluno em risco!</p>
          ) : (
            <div className="space-y-2">
              {data.atRiskStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student.id)}
                  className="w-full p-3 text-left rounded-lg hover:bg-red-50 border border-red-200 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{student.name}</span>
                    <span className="text-red-600 font-semibold">{student.average.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-green-500" />
            Alunos Excelentes (Média ≥ 8)
          </h3>
          {data.excellentStudents.length === 0 ? (
            <p className="text-gray-500">Nenhum aluno com média excelente ainda.</p>
          ) : (
            <div className="space-y-2">
              {data.excellentStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student.id)}
                  className="w-full p-3 text-left rounded-lg hover:bg-green-50 border border-green-200 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{student.name}</span>
                    <span className="text-green-600 font-semibold">{student.average.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {studentData && selectedStudent && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Detalhes do Aluno: {studentData.student?.name}
            </h3>
            <button onClick={() => { setSelectedStudent(null); setStudentData(null); }} className="text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Média Geral</p>
              <p className={`text-2xl font-bold ${parseFloat(studentData.overallAverage) < 5 ? 'text-red-600' : 'text-green-600'}`}>
                {studentData.overallAverage}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Total de Notas</p>
              <p className="text-2xl font-bold text-gray-800">{studentData.totalGrades}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-sm">Status</p>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${studentData.isAtRisk ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {studentData.isAtRisk ? 'Em Risco' : 'Regular'}
              </span>
            </div>
          </div>
          <h4 className="font-medium text-gray-700 mb-2">Notas por Disciplina</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {studentData.subjectAverages?.map((stat: any) => (
              <div key={stat.subject} className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-500">{stat.subject}</p>
                <p className="font-semibold text-gray-800">{stat.average}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}