
import React, { useState, Suspense } from 'react';
import { DataProvider, useData } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RequestList } from './pages/RequestList';
import { RequestDetail } from './pages/RequestDetail';
import { SetupPage } from './pages/SetupPage';
import { Layout } from './components/Layout';

// Lazy Load Admin Pages to improve initial load performance
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
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Redirect to Setup if not done
  if (!isSetupDone) {
    return <SetupPage />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    if (selectedRequestId) {
      return <RequestDetail requestId={selectedRequestId} onBack={() => setSelectedRequestId(null)} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'requests':
        return <RequestList onSelectRequest={setSelectedRequestId} />;
      case 'units':
        return <Suspense fallback={<LoadingSpinner />}><AdminUnits /></Suspense>;
      case 'users':
        return <Suspense fallback={<LoadingSpinner />}><AdminUsers /></Suspense>;
      case 'company':
        return <Suspense fallback={<LoadingSpinner />}><AdminCompany /></Suspense>;
      case 'database':
        return <Suspense fallback={<LoadingSpinner />}><AdminDatabase /></Suspense>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={(view) => {
      setCurrentView(view);
      setSelectedRequestId(null);
    }}>
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DataProvider>
  );
};

export default App;
