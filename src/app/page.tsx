'use client';

import { useState } from 'react';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      // Add other pages here
      default:
        return <Dashboard />;
    }
  };

  return (
    <div>
      <Topbar />
      <div className="layout">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
        <div className="main">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
