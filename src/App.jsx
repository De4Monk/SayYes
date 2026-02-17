import React from 'react';
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
      <MainLayout>
        <RoleBasedContent />
      </MainLayout>
    </RoleProvider>
  );
}

export default App;
