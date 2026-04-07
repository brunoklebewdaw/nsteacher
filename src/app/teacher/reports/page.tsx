'use client';

import { useState, useEffect } from 'react';
import { getTeacherData } from '@/actions/teacher';
import { generateStudentReport, generateClassReport, getSubjectStats, getClassAverages, askAIAboutCurrentReport } from '@/actions/reports';
import { FileText, Users, BarChart3, Download, TrendingUp, AlertTriangle, Award, Target } from 'lucide-react';
import ReportsChat from '@/components/teacher/ReportsChat';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [studentReport, setStudentReport] = useState<any>(null);
  const [classReport, setClassReport] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'class' | 'student'>('class');

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

  useEffect(() => {
    if (selectedClass && viewMode === 'class') {
      loadClassReport();
    }
  }, [selectedClass, viewMode]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentReport();
    }
  }, [selectedStudent]);

  async function loadClassReport() {
    const report = await generateClassReport(selectedClass);
    setClassReport(report);
  }

  async function loadStudentReport() {
    const report = await generateStudentReport(selectedStudent);
    setStudentReport(report);
  }

  if (!data) return <div className="p-8">Carregando...</div>;

  const { classes, students, subjects } = data;

  const classStudents = students.filter((s: any) => s.classId === selectedClass);

  const getGradeColor = (value: number | null) => {
    if (value === null) return 'text-gray-400';
    if (value >= 7) return 'text-green-600';
    if (value >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBg = (value: number | null) => {
    if (value === null) return 'bg-gray-100';
    if (value >= 7) return 'bg-green-100';
    if (value >= 5) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('class')}
            className={`flex items-center px-4 py-2 rounded-lg ${viewMode === 'class' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Users className="w-5 h-5 mr-2" />
            Por Turma
          </button>
          <button
            onClick={() => setViewMode('student')}
            className={`flex items-center px-4 py-2 rounded-lg ${viewMode === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <FileText className="w-5 h-5 mr-2" />
            Por Aluno
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
          >
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>{cls.name} ({cls.year})</option>
            ))}
          </select>
          {viewMode === 'student' && (
            <select 
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
            >
              <option value="">Selecione um aluno...</option>
              {classStudents.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {viewMode === 'class' && classReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Média da Turma</span>
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <div className={`text-3xl font-bold ${getGradeColor(classReport.overallClassAverage)}`}>
                {classReport.overallClassAverage?.toFixed(1) || '—'}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total de Alunos</span>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{classReport.class.totalStudents}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total de Notas</span>
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{classReport.totalGrades}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Disciplinas</span>
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{classReport.subjects.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Desempenho por Disciplina
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Disciplina</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Notas</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Média</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-green-600">≥ 7</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-yellow-600">5-7</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-red-600">{"< 5"}</th>
                  </tr>
                </thead>
                <tbody>
                  {classReport.subjects.map((subject: any) => (
                    <tr key={subject.subject} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{subject.subject}</td>
                      <td className="text-center py-3 px-4 text-gray-600">{subject.totalGrades}</td>
                      <td className={`text-center py-3 px-4 font-bold ${getGradeColor(subject.classAverage)}`}>
                        {subject.classAverage?.toFixed(1) || '—'}
                      </td>
                      <td className="text-center py-3 px-4 text-green-600 font-medium">{subject.above7}</td>
                      <td className="text-center py-3 px-4 text-yellow-600 font-medium">{subject.between5and7}</td>
                      <td className="text-center py-3 px-4 text-red-600 font-medium">{subject.below5}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Alunos com Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classStudents.map((student: any) => {
                const studentGrades = data.grades.filter((g: any) => g.studentId === student.id);
                const avg = studentGrades.length > 0 
                  ? studentGrades.reduce((s: number, g: any) => s + g.value, 0) / studentGrades.length 
                  : null;
                
                return (
                  <div key={student.id} className={`p-4 rounded-lg border ${getGradeBg(avg)}`}>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">{studentGrades.length} notas</span>
                      <span className={`text-lg font-bold ${getGradeColor(avg)}`}>
                        {avg?.toFixed(1) || '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'student' && selectedStudent && studentReport && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{studentReport.student.name}</h3>
                <p className="text-gray-500">{studentReport.student.class} - {studentReport.student.year}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${getGradeBg(studentReport.overallAverage)}`}>
                <div className="text-sm text-gray-500 text-center">Média Geral</div>
                <div className={`text-2xl font-bold ${getGradeColor(studentReport.overallAverage)}`}>
                  {studentReport.overallAverage?.toFixed(1) || '—'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Total de Notas</div>
                <div className="text-xl font-bold text-gray-900">{studentReport.totalGrades}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Disciplinas</div>
                <div className="text-xl font-bold text-gray-900">{studentReport.totalSubjects}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">Disciplinas ≥ 7</div>
                <div className="text-xl font-bold text-green-600">
                  {studentReport.subjects.filter((s: any) => s.average !== null && s.average >= 7).length}
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600">Disciplinas {"< 5"}</div>
                <div className="text-xl font-bold text-red-600">
                  {studentReport.subjects.filter((s: any) => s.average !== null && s.average < 5).length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Boletim Detalhado
            </h3>
            <div className="space-y-4">
              {studentReport.subjects.map((subject: any) => (
                <div key={subject.subject} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900">{subject.subject}</h4>
                    <div className={`px-3 py-1 rounded ${getGradeBg(subject.average)}`}>
                      <span className={`font-bold ${getGradeColor(subject.average)}`}>
                        Média: {subject.average?.toFixed(1) || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-4 text-gray-500 font-medium">Avaliação</th>
                          <th className="text-left py-2 px-4 text-gray-500 font-medium">Tipo</th>
                          <th className="text-center py-2 px-4 text-gray-500 font-medium">Peso</th>
                          <th className="text-center py-2 px-4 text-gray-500 font-medium">Nota</th>
                          <th className="text-right py-2 px-4 text-gray-500 font-medium">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subject.grades.map((grade: any, i: number) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-2 px-4 text-gray-900">{grade.assessmentName}</td>
                            <td className="py-2 px-4 text-gray-500">{grade.assessmentType}</td>
                            <td className="py-2 px-4 text-center text-gray-500">{grade.weight}x</td>
                            <td className={`py-2 px-4 text-center font-bold ${getGradeColor(grade.value)}`}>
                              {grade.value.toFixed(1)}
                            </td>
                            <td className="py-2 px-4 text-right text-gray-500">
                              {new Date(grade.date).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'student' && !selectedStudent && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum aluno selecionado</h3>
          <p className="mt-1 text-sm text-gray-500">Selecione um aluno para ver o relatório detalhado.</p>
        </div>
      )}

      {viewMode === 'class' && classReport && (
        <ReportsChat
          reportData={classReport}
          reportType="class"
          onAsk={askAIAboutCurrentReport}
        />
      )}

      {viewMode === 'student' && studentReport && (
        <ReportsChat
          reportData={studentReport}
          reportType="student"
          onAsk={askAIAboutCurrentReport}
        />
      )}
    </div>
  );
}