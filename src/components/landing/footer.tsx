import { BookOpen, Download } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-slate-900 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-500" />
          <span className="text-xl font-bold text-white tracking-tight">NSteacher</span>
        </div>
        
        <div className="flex gap-6 text-sm text-slate-400">
          <Link href="#termos" className="hover:text-white transition-colors">Termos de Uso</Link>
          <Link href="#privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          <Link href="#contato" className="hover:text-white transition-colors">Contato</Link>
          <a 
            href="https://play.google.com/store/apps/details?id=com.nsteacher.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Baixar App</span>
          </a>
        </div>
        
        <div className="text-slate-500 text-sm">
          &copy; 2026 NSteacher. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
