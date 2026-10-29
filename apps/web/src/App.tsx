import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import { CompanyDetail } from './pages/CompanyDetail';
import { Contacts } from './pages/Contacts';
import { Tasks } from './pages/Tasks';
import { DataSources } from './pages/DataSources';
import { ImportData } from './pages/ImportData';
import { Campaigns } from './pages/Campaigns';
import { Templates } from './pages/Templates';
import { Inbox } from './pages/Inbox';
import { Suppression } from './pages/Suppression';
import { AdminSettings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles,
}) => {
  const { user, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-slate-400 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="companies" element={<Companies />} />
            <Route path="companies/:id" element={<CompanyDetail />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="sources" element={<DataSources />} />
            <Route path="imports" element={<ImportData />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="templates" element={<Templates />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="suppression" element={<Suppression />} />
            <Route
              path="settings"
              element={
                <ProtectedRoute roles={['ADMIN', 'SALES_MANAGER']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
