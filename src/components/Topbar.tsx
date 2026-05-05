'use client';

import { useEffect } from 'react';

interface TopbarProps {
  practiceName: string;
  currentTime: string;
  onQuickAdd: () => void;
  onClearinghouse: () => void;
  onProfile: () => void;
  onPracticeOpen: () => void;
}

export default function Topbar({
  practiceName,
  currentTime,
  onQuickAdd,
  onClearinghouse,
  onProfile,
  onPracticeOpen,
}: TopbarProps) {
  useEffect(() => {
    return () => undefined;
  }, []);

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="logo">
          <div className="logo-i">⚕</div>
          <span className="logo-text">PracticeOS</span>
        </div>
        <button className="ps" type="button" onClick={onPracticeOpen}>
          {practiceName} ▾
        </button>
      </div>
      <div className="ta">
        <span style={{ fontSize: 11, color: 'var(--tx2)' }}>{currentTime}</span>
        <button className="btn btn-sm" type="button" onClick={onQuickAdd}>
          + Quick Add
        </button>
        <button className="btn btn-sm" type="button" onClick={onClearinghouse}>
          🔗 Clearinghouse
        </button>
        <button className="av" type="button" onClick={onProfile} title="Admin">
          AD
        </button>
      </div>
    </div>
  );
}