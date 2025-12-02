
import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RequestList } from './pages/RequestList';
import { RequestDetail } from './pages/RequestDetail';
import { SetupPage } from './pages/SetupPage';
import { Layout } from './components/Layout';
import { Portal } from './pages/Portal';
import { getTenant } from './config/tenants';
import { Tenant } from './types';

// Lazy Load Admin Pages
const AdminUnits = React.lazy(() => import('./pages/AdminUnits').then(module => ({ default: module.AdminUnits })));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers').then(module => ({ default: module.AdminUsers })));
const AdminCompany = React.lazy(() => import('./pages/AdminCompany').then(module => ({ default: module.AdminCompany })));
const AdminDatabase = React.lazy(() => import('./pages/AdminDatabase').then(module => ({ default: module.AdminDatabase })));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isSetupDone } = useData();

  // Se o sistema não está configurado (não tem usuários), mostra o Setup
  if (!isSetupDone) {
    return <SetupPage />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <Layout>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/requests" element={<RequestList />} />
                  <Route path="/requests/:id" element={<RequestDetail />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/units" element={<AdminUnits />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/company" element={<AdminCompany />} />
                  <Route path="/admin/database" element={<AdminDatabase />} />
                  
                  {/* Catch-all redirect to dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  // LÓGICA DE DETECÇÃO DE CLIENTE (TENANT)
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    // 1. Tentar pegar do Subdomínio (ex: nike.seusistema.com)
    const hostname = window.location.hostname; 
    const parts = hostname.split('.');
    
    // Ignora localhost e domínios raiz (seusistema.com)
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const isRootDomain = parts.length === 2; // ex: meusite.com
    
    let slug = '';
    // Se tiver subdomínio (ex: empresa.site.com), assume que 'empresa' é o slug
    if (!isLocalhost && !isRootDomain && parts.length > 2) {
       slug = parts[0]; 
    }

    // Se achou no subdomínio, carrega a config
    if (slug) {
        const tenant = getTenant(slug);
        if (tenant) {
            setCurrentTenant(tenant);
            setIsLoadingConfig(false);
            return;
        }
    }

    // 2. Fallback: Checa se usuário selecionou no Portal anteriormente (LocalStorage)
    const storedSlug = localStorage.getItem('link_req_tenant_slug');
    if (storedSlug) {
        const tenant = getTenant(storedSlug);
        if (tenant) {
            setCurrentTenant(tenant);
        }
    }
    
    setIsLoadingConfig(false);
  }, []);

  const handlePortalSelect = (slug: string) => {
      const tenant = getTenant(slug);
      if (tenant) {
          localStorage.setItem('link_req_tenant_slug', slug);
          setCurrentTenant(tenant);
      }
  };

  if (isLoadingConfig) return <LoadingSpinner />;

  // MUDANÇA CRÍTICA: Se não temos um Tenant definido, SEMPRE mostramos o Portal.
  // Removemos a verificação de hasEnvVars para garantir o fluxo SaaS.
  if (!currentTenant) {
      return <Portal onTenantSelect={handlePortalSelect} />;
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        {/* Passamos o Tenant completo para o Provider */}
        <DataProvider currentTenant={currentTenant}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
