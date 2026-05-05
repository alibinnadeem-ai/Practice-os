'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [period, setPeriod] = useState('This Month');

  const kpis = [
    { label: 'TOTAL BILLED', value: '$124,580', change: '+12.5%', up: true },
    { label: 'COLLECTED', value: '$89,240', change: '+8.2%', up: true },
    { label: 'OUTSTANDING AR', value: '$35,340', change: '-3.1%', up: false },
    { label: 'DENIAL RATE', value: '8.4%', change: '-1.2%', up: false },
    { label: 'AVG DAYS TO PAY', value: '24', change: '-2 days', up: false },
    { label: 'CLEAN CLAIMS %', value: '92.1%', change: '+1.8%', up: true },
  ];

  const payerMix = [
    { name: 'Delta Care', visits: 245, percentage: 42 },
    { name: 'Aetna', visits: 156, percentage: 27 },
    { name: 'Delta Dental', visits: 89, percentage: 15 },
    { name: 'Medicare', visits: 67, percentage: 12 },
    { name: 'Self-Pay', visits: 23, percentage: 4 },
  ];

  const denials = [
    { code: 'CO-45', reason: 'Missing Auth', count: 12 },
    { code: 'CO-97', reason: 'Invalid DX', count: 8 },
    { code: 'CO-16', reason: 'Timely Filing', count: 6 },
    { code: 'CO-50', reason: 'Non-Covered', count: 4 },
  ];

  const paQueue = [
    { patient: 'Emily Chen', payer: 'Delta Care', service: 'D4341', status: 'Pending' },
    { patient: 'Linda Patel', payer: 'Delta Dental', service: 'D2740', status: 'Pending' },
    { patient: 'Michael Torres', payer: 'Aetna', service: 'D7140', status: 'Pending' },
    { patient: 'Robert Kim', payer: 'Self-Pay', service: 'D7230', status: 'Pending' },
  ];

  const schedule = [
    { time: '08:00', patient: 'Sarah Johnson', provider: 'Dr. Smith', type: 'Follow-up', status: 'Confirmed' },
    { time: '09:00', patient: 'Michael Torres', provider: 'Dr. Jones', type: 'New Patient', status: 'Confirmed' },
    { time: '10:00', patient: 'Linda Patel', provider: 'Dr. Smith', type: 'Preventive', status: 'Pending' },
    { time: '11:00', patient: 'James Wilson', provider: 'Dr. Smith', type: 'Procedure', status: 'Arrived' },
  ];

  return (
    <div className="page act" id="pg-dashboard">
      <div className="ph">
        <div>
          <h1>Revenue Command Center</h1>
          <p id="dash-sub">Real-time snapshot · synced now</p>
        </div>
        <div className="pa">
          <select
            className="btn"
            style={{padding: '5px 8px'}}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>YTD</option>
          </select>
          <button className="btn btn-p">+ New Claim</button>
        </div>
      </div>
      <div className="content">
        <div className="kg" id="d-kpis">
          {kpis.map((kpi, index) => (
            <div key={index} className="kc">
              <div className="kl">{kpi.label}</div>
              <div className="kv">{kpi.value}</div>
              <div className={`ks ${kpi.up ? 'ku' : 'kd'}`}>{kpi.change}</div>
            </div>
          ))}
        </div>

        <div className="gc" style={{marginBottom:14}}>
          <div className="card" style={{margin:0}}>
            <div className="ch">
              <span className="ct">Revenue Flow (30d)</span>
              <span style={{fontSize:10,color:'var(--tx2)'}}>Billed → Collected</span>
            </div>
            <div className="cb">
              <canvas id="ch-rev" height="150"></canvas>
            </div>
          </div>
          <div className="card" style={{margin:0}}>
            <div className="ch">
              <span className="ct">Claim Status Mix</span>
            </div>
            <div className="cb">
              <canvas id="ch-status" height="150"></canvas>
            </div>
          </div>
        </div>

        <div className="g2" style={{marginBottom:14}}>
          <div className="card" style={{margin:0}}>
            <div className="ch">
              <span className="ct">Payer Mix (Visits)</span>
              <button className="btn btn-sm">All</button>
            </div>
            <div className="cb" id="d-payer">
              {payerMix.map((payer, index) => (
                <div key={index} style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <span>{payer.name}</span>
                  <span>{payer.visits} ({payer.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{margin:0}}>
            <div className="ch">
              <span className="ct">AR Aging Summary</span>
              <button className="btn btn-sm">Detail</button>
            </div>
            <div className="cb">
              <canvas id="ch-aging" height="130"></canvas>
            </div>
          </div>
        </div>

        <div className="g3">
          <div className="card" style={{margin:0}}>
            <div className="ch">
              <span className="ct">🚫 Top Denials</span>
            </div>
            <div className="cb" id="d-denials">
              {denials.map((denial, index) => (
                <div key={index} style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <span>{denial.code} - {denial.reason}</span>
                  <span>{denial.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{margin:0}}>
            <div className="ch">
              <span className="ct">🔐 PA Queue</span>
            </div>
            <div className="cb" id="d-pa">
              {paQueue.map((pa, index) => (
                <div key={index} style={{marginBottom:8}}>
                  <div style={{fontWeight:600}}>{pa.patient}</div>
                  <div style={{fontSize:11,color:'var(--tx2)'}}>{pa.payer} - {pa.service}</div>
                  <span className="badge by">{pa.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{margin:0}}>
            <div className="ch">
              <span className="ct">📅 Today's Schedule</span>
            </div>
            <div className="cb" id="d-sched">
              {schedule.map((appt, index) => (
                <div key={index} style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span>{appt.time} - {appt.patient}</span>
                  <span className="badge bg">{appt.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}