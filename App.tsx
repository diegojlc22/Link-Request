import React, { useState } from 'react';
import { DataProvider, useData } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RequestList } from './pages/RequestList';
import { RequestDetail } from './pages/RequestDetail';
import { AdminUnits } from './pages/AdminUnits';
import { AdminUsers } from './pages/AdminUsers';
import { AdminCompany } from './pages/AdminCompany';
import { AdminDatabase } from './pages/AdminDatabase';
import { SetupPage } from './pages/SetupPage';
import { Layout } from './components/Layout';

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
        return <AdminUnits />;
      case 'users':
        return <AdminUsers />;
      case 'company':
        return <AdminCompany />;
      case 'database':
        return <AdminDatabase />;
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