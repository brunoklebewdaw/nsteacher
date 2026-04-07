'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';
import { LogOut, Calendar, BookOpen, Users, FileText, CheckSquare, Bell, LayoutDashboard, Menu, X, MessageSquare, BarChart3, Sparkles, AlertTriangle, AlertCircle, CheckCircle, Info, Sun, Moon } from 'lucide-react';
import { getUnreadNotificationCount } from '@/actions/communication';
import { generateAlerts, saveNotifications, getNotifications, markNotificationRead } from '@/actions/alerts';
import { useTheme } from '@/lib/theme-provider';

const navItems = [
  { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
  { name: 'Agenda', path: '/teacher/schedule', icon: Calendar },
  { name: 'Matérias', path: '/teacher/subjects', icon: BookOpen },
  { name: 'Planejamento', path: '/teacher/planning', icon: FileText },
  { name: 'Turmas', path: '/teacher/students', icon: Users },
  { name: 'Avaliações', path: '/teacher/assessments', icon: CheckSquare },
  { name: 'Materiais', path: '/teacher/materials', icon: FileText },
  { name: 'Comunicação', path: '/teacher/communications', icon: MessageSquare },
  { name: 'Analytics', path: '/teacher/analytics', icon: BarChart3 },
  { name: 'AI Assistant', path: '/teacher/ai', icon: Sparkles },
  { name: 'Relatórios', path: '/teacher/reports', icon: FileText },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const count = await getUnreadNotificationCount();
        setNotificationCount(count);
      } catch (e) {}
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const { getSession } = await import('@/actions/auth');
        const session = await getSession();
        if (session?.user?.id) {
          const newAlerts = await generateAlerts(session.user.id);
          setAlerts(newAlerts);
          if (newAlerts.length > 0) {
            await saveNotifications(session.user.id, newAlerts);
          }
        }
      } catch (e) {}
    }
    loadAlerts();
  }, []);

  function getAlertIcon(type: string) {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  }

  function getAlertColor(type: string) {
    switch (type) {
      case 'alert': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  }

  if (pathname === '/teacher/setup') {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
        <span className="text-xl font-bold text-blue-600">NSteacher</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 hover:text-blue-600">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col ${isMobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
        <div className="h-16 hidden md:flex items-center justify-between px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">NSteacher</span>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/teacher' 
              ? pathname === '/teacher' 
              : pathname === item.path || pathname.startsWith(item.path + '/');
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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
          <h1 className="text-xl font-semibold text-gray-800">
            {navItems.find((item) => item.path === '/teacher' ? pathname === '/teacher' : pathname === item.path || pathname.startsWith(item.path + '/'))?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowAlerts(!showAlerts)} 
                className={`p-2 rounded-lg transition-colors ${
                  alerts.length > 0 
                    ? 'text-orange-500 hover:bg-orange-50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Bell className="w-6 h-6" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center">
                    {alerts.length > 9 ? '9+' : alerts.length}
                  </span>
                )}
              </button>
              {showAlerts && alerts.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Alertas do Dia</h3>
                  </div>
                  <div className="p-2">
                    {alerts.map((alert, idx) => (
                      <Link
                        key={idx}
                        href={alert.link || '#'}
                        onClick={() => setShowAlerts(false)}
                        className={`flex items-start p-3 rounded-lg mb-1 hover:bg-gray-50 ${getAlertColor(alert.type)}`}
                      >
                        <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
