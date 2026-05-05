'use client';

import { useState } from 'react';

export default function Topbar() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Update time every minute
  useState(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 60000);
    return () => clearInterval(timer);
  });

  return (
    <div className="topbar">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div className="logo">
          <div className="logo-i">⚕</div>
          <span className="logo-text">PracticeOS</span>
        </div>
        <div className="ps">
          <span id="prac-name">Smile Factory (DBS)</span> ▾
        </div>
      </div>
      <div className="ta">
        <span style={{fontSize:11,color:'var(--tx2)'}}>{currentTime}</span>
        <button className="btn btn-sm">+ Quick Add</button>
        <button className="btn btn-sm">🔗 Clearinghouse</button>
        <div className="av" title="Admin">AD</div>
      </div>
    </div>
  );
}