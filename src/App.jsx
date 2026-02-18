import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/templates/DashboardLayout';
import { SalonOperationsDashboard } from './components/pages/SalonOperationsDashboard';
import { RoleProvider, useRole } from './contexts/RoleContext';
import { MainLayout } from './components/templates/MainLayout';
import { MasterView } from './components/pages/MasterView';
import { Heading } from './components/atoms/Typography';

import { AdminView } from './components/pages/AdminView';
import { OwnerView } from './components/pages/OwnerView';
import { ClientView } from './components/pages/ClientView';

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

function App() {
  return (
    <RoleProvider>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<SalonOperationsDashboard />} />
          <Route path="/schedule" element={<MasterView />} /> {/* Legacy MasterView moved to schedule for now */}
          <Route path="/clients" element={<ClientView />} />
          <Route path="/inventory" element={<OwnerView />} /> {/* Using OwnerView as placeholder for Inventory */}
        </Route>
      </Routes>
    </RoleProvider>
  );
}

export default App;
