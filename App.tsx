
import React, { Suspense } from 'react';
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

  // Setup Flow
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
  return (
    <BrowserRouter>
      <ToastProvider>
        <DataProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
