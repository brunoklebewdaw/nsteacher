'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeTeacherSetup } from '@/actions/teacher';
import { BookOpen, Users, Plus, Trash2, X, Check } from 'lucide-react';

const SUGGESTED_SUBJECTS = [
  'Matemática', 'Português', 'Ciências', 'História', 'Geografia',
  'Física', 'Química', 'Biologia', 'Educação Física', 'Artes',
  'Inglês', 'Espanhol', 'Filosofia', 'Sociologia'
];

export default function TeacherSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState([{ name: '', level: 'Fundamental', year: 1 }]);

  const addSubject = () => {
    const trimmed = subjectInput.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed]);
      setSubjectInput('');
    }
  };

  const removeSubject = (subject: string) => {
    setSubjects(subjects.filter(s => s !== subject));
  };

  const toggleSuggestedSubject = (subject: string) => {
    if (subjects.includes(subject)) {
      removeSubject(subject);
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const addClass = () => {
    const lastClass = classes[classes.length - 1];
    setClasses([...classes, { 
      name: '', 
      level: lastClass?.level || 'Fundamental', 
      year: lastClass?.level === 'Ensino Médio' ? 1 : 1 
    }]);
  };

  const removeClass = (index: number) => {
    setClasses(classes.filter((_, i) => i !== index));
  };

  const updateClass = (index: number, field: string, value: string | number) => {
    const newClasses = [...classes];
    newClasses[index] = { ...newClasses[index], [field]: value };
    
    if (field === 'level') {
      const maxYear = value === 'Fundamental' ? 9 : 3;
      if (newClasses[index].year > maxYear) {
        newClasses[index].year = maxYear;
      }
    }
    
    setClasses(newClasses);
  };

  const getYearOptions = (level: string) => {
    const maxYear = level === 'Fundamental' ? 9 : 3;
    return Array.from({ length: maxYear }, (_, i) => i + 1);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subjects.length === 0) {
      alert('Por favor, adicione pelo menos uma matéria.');
      return;
    }
    if (classes.some(c => !c.name.trim())) {
      alert('Por favor, preencha o nome de todas as turmas.');
      return;
    }
    
    setLoading(true);
    
    const formData = new FormData();
    formData.append('subjects', JSON.stringify(subjects));
    formData.append('classes', JSON.stringify(classes));

    await completeTeacherSetup(formData);
    router.push('/teacher');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Bem-vindo ao NSteacher!
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Vamos configurar seu perfil para começar.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <form className="p-4 sm:p-8 space-y-8" onSubmit={handleSubmit}>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Quais matérias você leciona?
              </h3>
              
              <div className="mb-4">
                <p className="text-xs sm:text-sm text-gray-500 mb-2">Sugestões:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSuggestedSubject(subject)}
                      className={`px-2 py-1 text-xs sm:text-sm rounded-full transition-colors ${
                        subjects.includes(subject)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                  placeholder="Adicionar outra matéria..."
                  className="flex-1 border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={addSubject}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {subjects.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {subjects.map(subject => (
                    <span
                      key={subject}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm bg-blue-100 text-blue-800"
                    >
                      {subject}
                      <button
                        type="button"
                        onClick={() => removeSubject(subject)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-gray-200" />

            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Suas Turmas
                </h3>
                <button
                  type="button"
                  onClick={addClass}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </button>
              </div>

              <div className="space-y-4">
                {classes.map((cls, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome da Turma</label>
                        <input
                          type="text"
                          required
                          value={cls.name}
                          onChange={(e) => updateClass(index, 'name', e.target.value)}
                          placeholder="Ex: 6º Ano A"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                        />
                      </div>
                      <div className="w-full sm:w-40">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nível</label>
                        <select
                          value={cls.level}
                          onChange={(e) => updateClass(index, 'level', e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                        >
                          <option value="Fundamental">Ensino Fundamental</option>
                          <option value="Ensino Médio">Ensino Médio</option>
                        </select>
                      </div>
                      <div className="w-full sm:w-28">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          {cls.level === 'Fundamental' ? 'Ano (1-9)' : 'Ano (1-3)'}
                        </label>
                        <select
                          value={cls.year}
                          onChange={(e) => updateClass(index, 'year', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                        >
                          {getYearOptions(cls.level).map(year => (
                            <option key={year} value={year}>{year}º</option>
                          ))}
                        </select>
                      </div>
                      {classes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeClass(index)}
                          className="mt-5 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || subjects.length === 0}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Concluir Configuração'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
