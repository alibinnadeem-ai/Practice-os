'use client';

import { useState } from 'react';

const menuItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', badge: null },
  { id: 'scheduling', icon: '📅', label: 'Scheduling', badge: null },
  { id: 'claims', icon: '📋', label: 'Claims', badge: 5 },
  { id: 'denial', icon: '🚫', label: 'Denial Mgmt', badge: 12 },
  { id: 'aging', icon: '⏳', label: 'Claim Aging', badge: null },
  { id: 'payments', icon: '💵', label: 'Payments & EOB', badge: null },
  { id: 'writeoffs', icon: '✏️', label: 'Write-offs', badge: null },
  { id: 'insurance', icon: '🛡', label: 'Payer Mix', badge: null },
  { id: 'vob', icon: '🔍', label: 'VOB / Eligibility', badge: null },
  { id: 'priorauth', icon: '🔐', label: 'Prior Auth', badge: 4 },
  { id: 'credentialing', icon: '🎓', label: 'Credentialing', badge: null },
  { id: 'patients', icon: '👥', label: 'Patients', badge: null },
  { id: 'providers', icon: '👨‍⚕️', label: 'Providers', badge: null },
  { id: 'reports', icon: '📈', label: 'Reports', badge: null },
  { id: 'settings', icon: '⚙️', label: 'Settings', badge: null },
];

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav className={`sb ${collapsed ? 'col' : ''}`}>
      <div className="nst">Overview</div>
      <div
        className={`ni ${activePage === 'dashboard' ? 'act' : ''}`}
        onClick={() => onPageChange('dashboard')}
      >
        <span className="ni-ic">📊</span>
        <span className="nl">Dashboard</span>
      </div>
      <div
        className={`ni ${activePage === 'scheduling' ? 'act' : ''}`}
        onClick={() => onPageChange('scheduling')}
      >
        <span className="ni-ic">📅</span>
        <span className="nl">Scheduling</span>
      </div>

      <div className="nst">Revenue Cycle</div>
      {menuItems.slice(2, 7).map(item => (
        <div
          key={item.id}
          className={`ni ${activePage === item.id ? 'act' : ''}`}
          onClick={() => onPageChange(item.id)}
        >
          <span className="ni-ic">{item.icon}</span>
          <span className="nl">{item.label}</span>
          {item.badge && <span className="nb">{item.badge}</span>}
        </div>
      ))}

      <div className="nst">Insurance</div>
      {menuItems.slice(7, 11).map(item => (
        <div
          key={item.id}
          className={`ni ${activePage === item.id ? 'act' : ''}`}
          onClick={() => onPageChange(item.id)}
        >
          <span className="ni-ic">{item.icon}</span>
          <span className="nl">{item.label}</span>
          {item.badge && <span className="nb">{item.badge}</span>}
        </div>
      ))}

      <div className="nst">Practice</div>
      {menuItems.slice(11).map(item => (
        <div
          key={item.id}
          className={`ni ${activePage === item.id ? 'act' : ''}`}
          onClick={() => onPageChange(item.id)}
        >
          <span className="ni-ic">{item.icon}</span>
          <span className="nl">{item.label}</span>
          {item.badge && <span className="nb">{item.badge}</span>}
        </div>
      ))}
    </nav>
  );
}