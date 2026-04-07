'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';
import { LogOut, Users, LayoutDashboard, Menu, X, Key, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Professores', path: '/admin/teachers', icon: Users },
  { name: 'Keys', path: '/admin/keys', icon: Key },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
        <span className="text-xl font-bold text-blue-600">NSteacher Admin</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 hover:text-blue-600">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col ${isMobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
        <div className="h-16 hidden md:flex items-center justify-between px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">NSteacher Admin</span>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`mr-3 w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => logout()}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-4 md:px-8">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}
