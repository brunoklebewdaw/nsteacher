'use client'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme-provider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
      title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
    </button>
  )
}
