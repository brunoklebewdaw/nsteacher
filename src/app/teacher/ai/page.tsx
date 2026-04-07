'use client';

import { useState } from 'react';
import { askAIAboutReports, generateLessonPlan } from '@/actions/ai';
import { Sparkles, Send, Loader2, BookOpen, BarChart3, Lightbulb } from 'lucide-react';

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'planning'>('reports');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [lessonTheme, setLessonTheme] = useState('');
  const [lessonSubject, setLessonSubject] = useState('');
  const [lessonLevel, setLessonLevel] = useState('');
  const [lessonPlan, setLessonPlan] = useState<any>(null);

  async function handleSendMessage() {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await askAIAboutReports(userMessage);
      setChatHistory(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (error: any) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Erro: ${error.message}` }]);
    }
    
    setIsLoading(false);
  }

  async function handleGenerateLesson() {
    if (!lessonTheme.trim() || !lessonSubject.trim()) return;
    
    setIsLoading(true);
    setLessonPlan(null);

    try {
      const result = await generateLessonPlan(lessonTheme, lessonSubject, lessonLevel || undefined);
      setLessonPlan(result.response);
    } catch (error: any) {
      setLessonPlan({ error: error.message });
    }
    
    setIsLoading(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">AI Assistant</h2>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'reports' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <BarChart3 className="w-5 h-5" />
          Análise de Relatórios
        </button>
        <button
          onClick={() => setActiveTab('planning')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'planning' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <BookOpen className="w-5 h-5" />
          Planejador de Aulas
        </button>
      </div>

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Pergunte sobre seus dados pedagógicos</h3>
            <p className="text-sm text-gray-500">例: "Quais alunos estão em risco?" ou "Qual a média da turma A em Matemática?"</p>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Faça perguntas sobre seus alunos, turmas e desempenho</p>
                <p className="text-sm mt-2">Exemplos:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Quais alunos têm média abaixo de 5?</li>
                  <li>• Qual a distribuição de notas por disciplina?</li>
                  <li>• Quais turmas precisam de mais atenção?</li>
                </ul>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-purple-50 ml-12' : 'bg-gray-50 mr-12'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="bg-gray-50 mr-12 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processando...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Digite sua pergunta..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Gerar Plano de Aula com IA</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tema da Aula</label>
              <input
                type="text"
                value={lessonTheme}
                onChange={(e) => setLessonTheme(e.target.value)}
                placeholder="Ex: Frações"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
              <input
                type="text"
                value={lessonSubject}
                onChange={(e) => setLessonSubject(e.target.value)}
                placeholder="Ex: Matemática"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível/Turma (opcional)</label>
              <input
                type="text"
                value={lessonLevel}
                onChange={(e) => setLessonLevel(e.target.value)}
                placeholder="Ex: 5º ano"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateLesson}
            disabled={isLoading || !lessonTheme.trim() || !lessonSubject.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Gerar Plano de Aula
          </button>

          {lessonPlan && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              {lessonPlan.error ? (
                <p className="text-red-600">{lessonPlan.error}</p>
              ) : lessonPlan.rawResponse ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{lessonPlan.rawResponse}</pre>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessonPlan.title && (
                    <div>
                      <h4 className="font-semibold text-gray-800">{lessonPlan.title}</h4>
                      <p className="text-gray-600">{lessonPlan.description}</p>
                    </div>
                  )}
                  {lessonPlan.objectives && (
                    <div>
                      <h5 className="font-medium text-gray-700">Objetivos</h5>
                      <ul className="list-disc list-inside text-gray-600 text-sm">
                        {Array.isArray(lessonPlan.objectives) ? lessonPlan.objectives.map((obj: string, i: number) => (
                          <li key={i}>{obj}</li>
                        )) : <li>{lessonPlan.objectives}</li>}
                      </ul>
                    </div>
                  )}
                  {lessonPlan.activities && (
                    <div>
                      <h5 className="font-medium text-gray-700">Atividades</h5>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{lessonPlan.activities}</p>
                    </div>
                  )}
                  {lessonPlan.evaluation && (
                    <div>
                      <h5 className="font-medium text-gray-700">Avaliação</h5>
                      <p className="text-gray-600 text-sm">{lessonPlan.evaluation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}