
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Building2, 
  Settings, 
  LogOut, 
  Menu, 
  Sun, 
  Moon,
  Bell,
  Briefcase,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const { companies } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Get Current Company (Mock: first one or user's company)
  const currentCompany = companies.find(c => c.id === currentUser?.companyId) || companies[0];
  const companyName = currentCompany?.name || 'Link-Request';
  const companyLogoLetter = companyName.charAt(0).toUpperCase();

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Requisições', icon: Ticket },
  ];

  if (isAdmin) {
    menuItems.push(
      { id: 'units', label: 'Unidades', icon: Building2 },
      { id: 'users', label: 'Usuários', icon: Users },
      { id: 'company', label: 'Minha Empresa', icon: Briefcase },
      { id: 'database', label: 'Banco de Dados', icon: Database },
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-600/20">
              {companyLogoLetter}
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate max-w-[140px]">
              {companyName}
            </span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'}
                `}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img 
              src={currentUser?.avatarUrl} 
              alt={currentUser?.name} 
              className="h-10 w-10 rounded-full bg-gray-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4">
             {/* Breadcrumb placeholder or search */}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};