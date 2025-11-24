import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Building2, 
  LogOut, 
  Menu, 
  Sun, 
  Moon,
  Bell,
  Briefcase
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const { companies, requests, units } = useData();
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Notification Logic: Watch for new requests (Real-time)
  const previousRequestsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // If it's the first load, just populate the ref and don't notify
    if (isFirstLoad.current) {
      if (requests.length > 0) {
        requests.forEach(r => previousRequestsRef.current.add(r.id));
        isFirstLoad.current = false;
      }
      return;
    }

    // Check for new IDs
    if (isAdmin) {
      requests.forEach(req => {
        if (!previousRequestsRef.current.has(req.id)) {
          // Verify if it's actually recent (created in the last minute) 
          // to avoid alerts from old data syncing late
          const createdTime = new Date(req.createdAt).getTime();
          const now = Date.now();
          const isRecent = (now - createdTime) < 60000; // 1 minute

          if (isRecent) {
             const unit = units.find(u => u.id === req.unitId);
             const unitName = unit ? unit.name : 'Unidade Desconhecida';
             showToast(`Nova Requisição: ${req.title} - ${unitName}`, 'info');
             setUnreadCount(prev => prev + 1);
          }
          previousRequestsRef.current.add(req.id);
        }
      });
    } else {
      // For non-admins, just keep the ref updated to avoid stale state logic
      requests.forEach(r => previousRequestsRef.current.add(r.id));
    }
  }, [requests, isAdmin, showToast, units]);


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

  const handleClearNotifications = () => {
    if (unreadCount > 0) {
      setUnreadCount(0);
      showToast('Notificações marcadas como lidas', 'success');
    }
  };

  const mainNavItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/requests', label: 'Requisições', icon: Ticket },
  ];

  const adminNavItems = [
    { path: '/admin/units', label: 'Unidades', icon: Building2 },
    { path: '/admin/users', label: 'Usuários', icon: Users },
    { path: '/admin/company', label: 'Minha Empresa', icon: Briefcase },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem: React.FC<{ item: typeof mainNavItems[0] }> = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
    
    return (
      <Link
        to={item.path}
        onClick={() => setIsSidebarOpen(false)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium
          ${isActive 
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'}
        `}
      >
        <Icon className="h-5 w-5" />
        {item.label}
      </Link>
    );
  };

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
          {mainNavItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}

          {isAdmin && (
            <>
              <div className="pt-6 pb-2 px-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Gerenciamento
                </p>
              </div>
              {adminNavItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </>
          )}
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
            onClick={handleLogout}
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
            <button 
              onClick={handleClearNotifications}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              title={unreadCount > 0 ? `${unreadCount} novas notificações` : 'Sem novas notificações'}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-gray-800"></span>
                </span>
              )}
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