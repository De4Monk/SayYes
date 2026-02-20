import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/templates/DashboardLayout';
import { SalonOperationsDashboard } from './components/pages/SalonOperationsDashboard';
import { RoleProvider, useRole } from './contexts/RoleContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { MainLayout } from './components/templates/MainLayout';
import { MasterView } from './components/pages/MasterView';
import { Heading } from './components/atoms/Typography';

import { AdminView } from './components/pages/AdminView';
import { OwnerView } from './components/pages/OwnerView';
import { ClientView } from './components/pages/ClientView';
import { SettingsView } from './pages/SettingsView';

const RoleBasedContent = () => {
  const { currentRole } = useRole();

  switch (currentRole) {
    case 'master':
      return <MasterView />;
    case 'admin':
      return <AdminView />;
    case 'owner':
      return <OwnerView />;
    case 'client':
      return <ClientView />;
    default:
      return <MasterView />;
  }
};

const ManageRoute = () => {
  const { currentRole } = useRole();
  return currentRole === 'owner' ? <OwnerView /> : <AdminView />;
};

function App() {
  return (
    <RoleProvider>
      <AuthGuard>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<SalonOperationsDashboard />} />
            <Route path="/schedule" element={<MasterView />} /> {/* Legacy MasterView moved to schedule for now */}
            <Route path="/clients" element={<ClientView />} />
            <Route path="/manage" element={<ManageRoute />} />
            <Route path="/inventory" element={<OwnerView />} /> {/* Using OwnerView as placeholder for Inventory */}
            <Route path="/settings" element={<SettingsView />} />
          </Route>
          {/* 🔥 ЛОВУШКА ДЛЯ TELEGRAM МУСОРА В URL 🔥 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGuard>
    </RoleProvider>
  );
}

export default App;
