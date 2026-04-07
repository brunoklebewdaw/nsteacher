'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ImportResult {
  success: boolean;
  message: string;
  line?: number;
}

type ImportFunction = (students: ParsedRow[]) => Promise<{ success?: boolean; count?: number; error?: string }>;

interface ParsedRow {
  name: string;
  classId?: string;
}

export default function ImportStudentsModal({ 
  isOpen, 
  onClose, 
  onImport,
  classes 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onImport: ImportFunction;
  classes: any[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    setErrors([]);
    setPreview([]);
    setResults([]);

    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setErrors(['O arquivo deve ter pelo menos um cabeçalho e uma linha de dados']);
        setParsing(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIndex = headers.findIndex(h => h === 'nome' || h === 'name');
      
      if (nameIndex === -1) {
        setErrors(['Coluna "nome" não encontrada']);
        setParsing(false);
        return;
      }

      const parsed: ParsedRow[] = [];
      const parseErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const name = values[nameIndex];
        
        if (!name || name.length < 2) {
          parseErrors.push(`Linha ${i + 1}: Nome inválido`);
          continue;
        }

        parsed.push({ name });
      }

      if (parseErrors.length > 0) {
        setErrors(parseErrors.slice(0, 5));
      }

      setPreview(parsed.slice(0, 10));
    } catch (err) {
      setErrors(['Erro ao ler arquivo. Use formato CSV com codificação UTF-8.']);
    }

    setParsing(false);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setImporting(true);
    setResults([]);

    try {
      const result = await onImport(preview) as any;
      if (result && 'error' in result) {
        setResults([{ success: false, message: result.error || 'Erro ao importar' }]);
      } else {
        setResults([{ success: true, message: `${preview.length} alunos importados com sucesso!` }]);
        setTimeout(() => {
          onClose();
          setFile(null);
          setPreview([]);
          setResults([]);
        }, 2000);
      }
    } catch (err: any) {
      setResults([{ success: false, message: err.message || 'Erro ao importar' }]);
    }

    setImporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Importar Alunos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Importe alunos de um arquivo CSV (coluna: nome)
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-8 h-8" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">Clique ou arraste o arquivo CSV</p>
                <p className="text-xs text-gray-400 mt-1">Cabeçalho: nome</p>
              </>
            )}
          </div>

          {parsing && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processando arquivo...</span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <AlertCircle className="w-4 h-4" />
                Erros encontrados
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Prévia ({preview.length} alunos):
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {preview.map((row, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                    {row.name}
                  </li>
                ))}
                {preview.length < 10 && (
                  <li className="text-gray-400 italic">... e mais {preview.length} alunos</li>
                )}
              </ul>
            </div>
          )}

          {results.length > 0 && (
            <div className={`rounded-lg p-3 ${results[0].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`flex items-center gap-2 ${results[0].success ? 'text-green-700' : 'text-red-700'}`}>
                {results[0].success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-medium">{results[0].message}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || importing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Importar {preview.length} alunos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
