'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ReportsChatProps {
  reportData: any;
  reportType: 'class' | 'student';
  onAsk: (message: string, reportData: any, reportType: 'class' | 'student') => Promise<{ response: string; type: string }>;
}

export default function ReportsChat({ reportData, reportType, onAsk }: ReportsChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await onAsk(userMessage, reportData, reportType);
      setChatHistory(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (error: any) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Erro: ${error.message}` }]);
    }
    
    setIsLoading(false);
  };

  const suggestedQuestions = [
    'Quais são os pontos fortes dessa turma/aluno?',
    'Quais alunos/disciplinas precisam de mais atenção?',
    'Que estratégias pedagógicas você sugere?',
    'Compare o desempenho com médias anteriores',
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Chat com IA sobre este relatório"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-end p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-white font-semibold">Analisar Relatório</h3>
                  <p className="text-purple-200 text-xs">{reportType === 'class' ? 'Relatório de Turma' : 'Relatório de Aluno'}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:bg-purple-700 p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-purple-300" />
                  <p className="text-gray-600 mb-4">Faça perguntas sobre este relatório</p>
                  <div className="space-y-2">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setMessage(q);
                        }}
                        className="block w-full text-left text-sm p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && <Bot className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />}
                  <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && <User className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <Bot className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Processando...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
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
          </div>
        </div>
      )}
    </>
  );
}
