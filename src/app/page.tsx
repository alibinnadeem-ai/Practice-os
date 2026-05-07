'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  LineController,
  DoughnutController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  LineController,
  DoughnutController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
);

type PageKey =
  | 'dashboard'
  | 'scheduling'
  | 'claims'
  | 'denial'
  | 'aging'
  | 'payments'
  | 'writeoffs'
  | 'insurance'
  | 'vob'
  | 'priorauth'
  | 'credentialing'
  | 'patients'
  | 'providers'
  | 'reports'
  | 'settings';

type Practice = { id: number; name: string; type: string; npi: string };
type Patient = { id: string; fn: string; ln: string; dob: string; ph: string; ins: string; mid: string; bal: number; lv: string };
type Appointment = { time: string; pt: string; dob: string; prov: string; type: string; ins: string; vob: string; cop: string; status: string };
type Claim = { id: string; dbId: string; pt: string; dos: string; pay: string; billed: number; paid: number; bal: number; status: string; age: number };
type Denial = { cl: string; pt: string; pay: string; amt: number; code: string; reason: string; days: number; appeal: string };
type Payment = { date: string; cl: string; pt: string; pay: string; billed: number; allowed: number; adj: number; paid: number; pr: number; type: string };
type Writeoff = { date: string; cl: string; pt: string; pay: string; amt: number; cat: string; auth: string; reason: string };
type Payer = { name: string; type: string; pid: string; rate: number; visits: number; ar: number; exp: string; status: string };
type VOB = { pt: string; pay: string; mid: string; appt: string; ded: number; met: number; cop: number; coins: string; auth: string; status: string };
type PriorAuth = { id: string; pt: string; pay: string; svc: string; req: string; units: number; appr: number; exp: string; status: string };
type Cred = { prov: string; pay: string; npi: string; sub: string; eff: string; exp: string; days: number; status: string };
type Provider = { name: string; spec: string; npi: string; dea: string; rvu: number; col: number; cred: number; status: string };
type ToastItem = { id: string; message: string; type: 'ts' | 'ti' | 'te' | 'tw2' };

const fmt = (n: number) => '$' + Number(n).toLocaleString();
const today = () => new Date().toISOString().slice(0, 10);
const bucket = (a: number) => (a <= 30 ? '0-30' : a <= 60 ? '31-60' : a <= 90 ? '61-90' : '>90');
const ageBadgeClass = (a: number) => (a > 90 ? 'br' : a > 60 ? 'by' : a > 30 ? 'bb' : 'bg');
const badgeClass = (s: string) => {
  const map: Record<string, string> = {
    Paid: 'bg',
    Denied: 'br',
    Pending: 'by',
    Submitted: 'bb',
    Resubmitted: 'bp',
    Approved: 'bg',
    Active: 'bg',
    'Expiring Soon': 'br',
    Partial: 'by',
    'Not Filed': 'bx',
    Filed: 'bb',
    Verified: 'bg',
    Confirmed: 'bg',
    Arrived: 'bb',
    Expiring: 'by',
  };
  return `badge ${map[s] || 'bx'}`;
};

const initialPractices: Practice[] = [
  { id: 1, name: 'Smile Factory (DBS)', type: 'Dental', npi: '1234567890' },
  { id: 2, name: 'CityMed Clinic', type: 'Medical', npi: '9876543210' },
  { id: 3, name: 'QuickLab Services', type: 'Lab', npi: '5551234567' },
];

const initialPatients: Patient[] = [
  { id: 'P001', fn: 'Sarah', ln: 'Johnson', dob: '1985-03-12', ph: '(555)201-1234', ins: 'Delta Care', mid: 'DC-101', bal: 205, lv: '2025-04-10' },
  { id: 'P002', fn: 'Michael', ln: 'Torres', dob: '1972-07-28', ph: '(555)202-5678', ins: 'Aetna', mid: 'AE-234', bal: 0, lv: '2025-04-15' },
  { id: 'P003', fn: 'Linda', ln: 'Patel', dob: '1990-11-05', ph: '(555)203-9012', ins: 'Delta Dental', mid: 'DD-567', bal: 75, lv: '2025-04-18' },
  { id: 'P004', fn: 'James', ln: 'Wilson', dob: '1968-01-19', ph: '(555)204-3456', ins: 'Medicare', mid: 'MC-890', bal: 340, lv: '2025-03-22' },
  { id: 'P005', fn: 'Emily', ln: 'Chen', dob: '1995-09-30', ph: '(555)205-7890', ins: 'Delta Care', mid: 'DC-445', bal: 58, lv: '2025-04-28' },
  { id: 'P006', fn: 'Robert', ln: 'Kim', dob: '1980-06-14', ph: '(555)206-2345', ins: 'Self-Pay', mid: '—', bal: 620, lv: '2025-04-05' },
  { id: 'P007', fn: 'Maria', ln: 'Garcia', dob: '1962-12-22', ph: '(555)207-6789', ins: 'Medicaid', mid: 'MED-321', bal: 0, lv: '2025-04-20' },
];

const initialAppointments: Appointment[] = [
  { time: '08:00', pt: 'Sarah Johnson', dob: '1985-03-12', prov: 'Dr. Smith', type: 'Follow-up', ins: 'Delta Care', vob: '✅', cop: '$20', status: 'Confirmed' },
  { time: '09:00', pt: 'Michael Torres', dob: '1972-07-28', prov: 'Dr. Jones', type: 'New Patient', ins: 'Aetna', vob: '✅', cop: '$35', status: 'Confirmed' },
  { time: '10:00', pt: 'Linda Patel', dob: '1990-11-05', prov: 'Dr. Smith', type: 'Preventive', ins: 'Delta Dental', vob: '⚠️', cop: '$0', status: 'Pending' },
  { time: '11:00', pt: 'James Wilson', dob: '1968-01-19', prov: 'Dr. Smith', type: 'Procedure', ins: 'Medicare', vob: '✅', cop: '$0', status: 'Arrived' },
  { time: '13:00', pt: 'Emily Chen', dob: '1995-09-30', prov: 'Dr. Jones', type: 'Follow-up', ins: 'Delta Care', vob: '❌', cop: '$20', status: 'Confirmed' },
  { time: '14:00', pt: 'Robert Kim', dob: '1980-06-14', prov: 'Dr. Smith', type: 'Urgent', ins: 'Self-Pay', vob: 'N/A', cop: 'N/A', status: 'Confirmed' },
  { time: '15:30', pt: 'Maria Garcia', dob: '1962-12-22', prov: 'Dr. Jones', type: 'New Patient', ins: 'Medicaid', vob: '⚠️', cop: '$3', status: 'Confirmed' },
];

const initialClaims: Claim[] = [
  { id: 'CLM-001', dbId: 'dummy-1', pt: 'Sarah Johnson', dos: '2025-04-10', pay: 'Delta Care', billed: 450, paid: 280, bal: 170, status: 'Paid', age: 22 },
  { id: 'CLM-002', dbId: 'dummy-2', pt: 'Michael Torres', dos: '2025-04-15', pay: 'Aetna', billed: 1200, paid: 0, bal: 1200, status: 'Denied', age: 17 },
  { id: 'CLM-003', dbId: 'dummy-3', pt: 'Linda Patel', dos: '2025-04-18', pay: 'Delta Dental', billed: 320, paid: 245, bal: 75, status: 'Paid', age: 14 },
  { id: 'CLM-004', dbId: 'dummy-4', pt: 'James Wilson', dos: '2025-03-22', pay: 'Medicare', billed: 980, paid: 0, bal: 980, status: 'Pending', age: 40 },
  { id: 'CLM-005', dbId: 'dummy-5', pt: 'Emily Chen', dos: '2025-04-28', pay: 'Delta Care', billed: 180, paid: 122, bal: 58, status: 'Paid', age: 4 },
  { id: 'CLM-006', dbId: 'dummy-6', pt: 'Robert Kim', dos: '2025-04-05', pay: 'Self-Pay', billed: 620, paid: 0, bal: 620, status: 'Pending', age: 27 },
  { id: 'CLM-007', dbId: 'dummy-7', pt: 'Maria Garcia', dos: '2025-04-20', pay: 'Medicaid', billed: 275, paid: 0, bal: 275, status: 'Submitted', age: 12 },
  { id: 'CLM-008', dbId: 'dummy-8', pt: 'Sarah Johnson', dos: '2025-03-01', pay: 'Delta Care', billed: 890, paid: 0, bal: 890, status: 'Denied', age: 61 },
  { id: 'CLM-009', dbId: 'dummy-9', pt: 'Michael Torres', dos: '2025-02-10', pay: 'Aetna', billed: 540, paid: 0, bal: 540, status: 'Resubmitted', age: 80 },
  { id: 'CLM-010', dbId: 'dummy-10', pt: 'Linda Patel', dos: '2025-01-15', pay: 'Delta Dental', billed: 760, paid: 0, bal: 760, status: 'Denied', age: 105 },
];

const initialDenials: Denial[] = [
  { cl: 'CLM-002', pt: 'Michael Torres', pay: 'Aetna', amt: 1200, code: 'CO-97', reason: 'Bundled Service', days: 17, appeal: 'Pending' },
  { cl: 'CLM-008', pt: 'Sarah Johnson', pay: 'Delta Care', amt: 890, code: 'CO-4', reason: 'Inconsistent Modifier', days: 61, appeal: 'Not Filed' },
  { cl: 'CLM-010', pt: 'Linda Patel', pay: 'Delta Dental', amt: 760, code: 'PR-1', reason: 'Patient Deductible', days: 105, appeal: 'Not Filed' },
  { cl: 'CLM-012', pt: 'James Wilson', pay: 'Medicare', amt: 450, code: 'CO-29', reason: 'Timely Filing', days: 120, appeal: 'Filed' },
  { cl: 'CLM-014', pt: 'Emily Chen', pay: 'Delta Care', amt: 325, code: 'CO-50', reason: 'Non-Covered Service', days: 22, appeal: 'Pending' },
];

const initialPayments: Payment[] = [
  { date: '2025-04-22', cl: 'CLM-001', pt: 'Sarah Johnson', pay: 'Delta Care', billed: 450, allowed: 350, adj: 70, paid: 280, pr: 170, type: 'Ins EFT' },
  { date: '2025-04-25', cl: 'CLM-003', pt: 'Linda Patel', pay: 'Delta Dental', billed: 320, allowed: 300, adj: 55, paid: 245, pr: 75, type: 'Ins EFT' },
  { date: '2025-04-28', cl: 'CLM-005', pt: 'Emily Chen', pay: 'Delta Care', billed: 180, allowed: 160, adj: 38, paid: 122, pr: 58, type: 'Ins Check' },
  { date: '2025-04-30', cl: 'CLM-006', pt: 'Robert Kim', pay: 'Patient', billed: 620, allowed: 620, adj: 0, paid: 200, pr: 420, type: 'Patient CC' },
];

const initialWriteoffs: Writeoff[] = [
  { date: '2025-04-15', cl: 'CLM-W01', pt: 'Maria Garcia', pay: 'Medicaid', amt: 45, cat: 'Contractual Adjustment', auth: 'Dr. Smith', reason: 'Medicaid rate diff' },
  { date: '2025-04-20', cl: 'CLM-W02', pt: 'James Wilson', pay: 'Medicare', amt: 120, cat: 'Contractual Adjustment', auth: 'Dr. Smith', reason: 'Medicare limiting charge' },
  { date: '2025-04-28', cl: 'CLM-W03', pt: 'Robert Kim', pay: 'Self-Pay', amt: 80, cat: 'Charity Care', auth: 'Admin', reason: 'Financial hardship approved' },
];

const initialPayers: Payer[] = [
  { name: 'Delta Care', type: 'Commercial', pid: 'DC001', rate: 82, visits: 45, ar: 18, exp: '2026-01-01', status: 'Active' },
  { name: 'Delta Dental', type: 'Commercial', pid: 'DD002', rate: 78, visits: 38, ar: 22, exp: '2026-06-01', status: 'Active' },
  { name: 'Aetna', type: 'Commercial', pid: 'AE003', rate: 74, visits: 28, ar: 28, exp: '2025-12-01', status: 'Active' },
  { name: 'Medicare', type: 'Government', pid: 'MC001', rate: 65, visits: 20, ar: 35, exp: 'N/A', status: 'Active' },
  { name: 'Medicaid', type: 'Government', pid: 'MED001', rate: 55, visits: 15, ar: 42, exp: 'N/A', status: 'Active' },
  { name: 'Self-Pay', type: 'Self-Pay', pid: '—', rate: 40, visits: 14, ar: 60, exp: 'N/A', status: 'Active' },
];

const initialVOB: VOB[] = [
  { pt: 'Emily Chen', pay: 'Delta Care', mid: 'DC-445', appt: '2025-05-02', ded: 1500, met: 1450, cop: 20, coins: '20%', auth: 'No', status: 'Verified' },
  { pt: 'Linda Patel', pay: 'Delta Dental', mid: 'DD-567', appt: '2025-05-02', ded: 2000, met: 850, cop: 30, coins: '30%', auth: 'Yes', status: 'Pending' },
  { pt: 'Maria Garcia', pay: 'Medicaid', mid: 'MED-321', appt: '2025-05-02', ded: 0, met: 0, cop: 3, coins: '0%', auth: 'No', status: 'Pending' },
];

const initialPriorAuths: PriorAuth[] = [
  { id: 'PA-001', pt: 'Sarah Johnson', pay: 'Delta Care', svc: 'D4341 - Perio Scaling', req: '2025-04-01', units: 4, appr: 4, exp: '2025-10-01', status: 'Approved' },
  { id: 'PA-002', pt: 'Michael Torres', pay: 'Aetna', svc: 'Implant Placement', req: '2025-04-15', units: 1, appr: 0, exp: '—', status: 'Pending' },
  { id: 'PA-003', pt: 'James Wilson', pay: 'Medicare', svc: 'Crown D2740', req: '2025-04-20', units: 2, appr: 1, exp: '2025-08-01', status: 'Partial' },
  { id: 'PA-004', pt: 'Robert Kim', pay: 'Self-Pay', svc: 'Wisdom Extraction', req: '2025-04-25', units: 4, appr: 0, exp: '—', status: 'Pending' },
];

const initialCredentialing: Cred[] = [
  { prov: 'Dr. Smith', pay: 'Delta Care', npi: '1234567890', sub: '2023-01-15', eff: '2023-03-01', exp: '2026-03-01', days: 304, status: 'Active' },
  { prov: 'Dr. Smith', pay: 'Aetna', npi: '1234567890', sub: '2023-01-15', eff: '2023-04-01', exp: '2025-05-20', days: 18, status: 'Expiring Soon' },
  { prov: 'Dr. Jones', pay: 'Delta Dental', npi: '0987654321', sub: '2024-06-01', eff: '2024-08-01', exp: '2026-08-01', days: 457, status: 'Active' },
  { prov: 'Dr. Jones', pay: 'Medicare', npi: '0987654321', sub: '2024-01-01', eff: '2024-03-01', exp: '2025-05-10', days: 8, status: 'Expiring Soon' },
];

const initialProviders: Provider[] = [
  { name: 'Dr. Sarah Smith', spec: 'General Dentistry', npi: '1234567890', dea: 'AS1234567', rvu: 280, col: 42500, cred: 4, status: 'Active' },
  { name: 'Dr. Marcus Jones', spec: 'Endodontics', npi: '0987654321', dea: 'AJ7654321', rvu: 195, col: 31200, cred: 3, status: 'Active' },
];

export default function Home() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [practiceName, setPracticeName] = useState(initialPractices[0].name);
  const [practices, setPractices] = useState<Practice[]>(initialPractices);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [denials, setDenials] = useState<Denial[]>(initialDenials);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [writeoffs, setWriteoffs] = useState<Writeoff[]>(initialWriteoffs);
  const [payers, setPayers] = useState<Payer[]>(initialPayers);
  const [vobs, setVobs] = useState<VOB[]>(initialVOB);
  const [priorAuths, setPriorAuths] = useState<PriorAuth[]>(initialPriorAuths);
  const [credentialing, setCredentialing] = useState<Cred[]>(initialCredentialing);
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [modal, setModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [patientEditIndex, setPatientEditIndex] = useState<number | null>(null);
  const [settingsTab, setSettingsTab] = useState('Practice Info');
  const [clockText, setClockText] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const revChartRef = useRef<HTMLCanvasElement | null>(null);
  const statusChartRef = useRef<HTMLCanvasElement | null>(null);
  const agingChartRef = useRef<HTMLCanvasElement | null>(null);
  const denyChartRef = useRef<HTMLCanvasElement | null>(null);
  const denyPayChartRef = useRef<HTMLCanvasElement | null>(null);
  const pmChartRef = useRef<HTMLCanvasElement | null>(null);
  const prChartRef = useRef<HTMLCanvasElement | null>(null);
  const trendChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstances = useRef<Record<string, Chart | null>>({});

  const destroyChart = (key: string) => {
    const chart = chartInstances.current[key];
    if (chart) {
      chart.destroy();
      chartInstances.current[key] = null;
    }
  };

  const buildChart = (key: string, canvas: HTMLCanvasElement | null, config: any) => {
    if (!canvas) return;
    destroyChart(key);
    chartInstances.current[key] = new Chart(canvas, config);
  };

  const toast = (message: string, type: ToastItem['type'] = 'ti') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts(prev => prev.filter(item => item.id !== id)), 3500);
  };

  const openModal = async (id: string) => {
    // Ensure data is loaded before opening modals that need it
    if (id === 'm-claim' || id === 'm-appt' || id === 'm-pa' || id === 'm-vob' || id === 'm-wo' || id === 'm-pay') {
      if (patients.length === 0 || providers.length === 0 || payers.length === 0) {
        toast('Loading data...', 'ti');
        await refreshData();
      }
    }

    setModal(id);
    if (id === 'm-claim' || id === 'm-appt' || id === 'm-pa' || id === 'm-vob' || id === 'm-wo' || id === 'm-pay' || id === 'm-payer' || id === 'm-cred' || id === 'm-prov') {
      setFormData({});
      setPatientEditIndex(null);
    }
  };

  const closeModal = () => {
    setModal(null);
    setPatientEditIndex(null);
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockText(`${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${now.toLocaleDateString([], { month: 'short', day: 'numeric' })}`);
    };
    updateClock();
    const interval = window.setInterval(updateClock, 60000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch claims
        const claimsResponse = await fetch('/api/claims');
        if (claimsResponse.ok) {
          const claimsData = await claimsResponse.json();
          // Transform API data to match frontend format
          const transformedClaims = claimsData.map((claim: any) => ({
            id: claim.claimNumber,
            pt: `${claim.patient.firstName} ${claim.patient.lastName}`,
            dos: new Date(claim.dateOfService).toISOString().slice(0, 10),
            pay: claim.payer.name,
            billed: claim.billedAmount,
            paid: claim.billedAmount - claim.balance,
            bal: claim.balance,
            status: claim.status,
            age: claim.age,
          }));
          setClaims(transformedClaims);
        }

        // Fetch patients
        const patientsResponse = await fetch('/api/patients');
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          const transformedPatients = patientsData.map((patient: any) => ({
            id: patient.mrn,
            fn: patient.firstName,
            ln: patient.lastName,
            dob: new Date(patient.dob).toISOString().slice(0, 10),
            ph: patient.phone || '',
            ins: patient.insurance || '',
            mid: patient.memberId || '',
            bal: patient.balance,
            lv: patient.lastVisit ? new Date(patient.lastVisit).toISOString().slice(0, 10) : '',
          }));
          setPatients(transformedPatients);
        }

        // Fetch providers
        const providersResponse = await fetch('/api/providers');
        if (providersResponse.ok) {
          const providersData = await providersResponse.json();
          const transformedProviders = providersData.map((provider: any) => ({
            name: provider.name,
            spec: provider.specialty || '',
            npi: provider.npi,
            dea: provider.dea || '',
            rvu: provider.monthlyRVU || 0,
            col: provider.collections || 0,
            cred: 0, // This would need to be calculated from credentialings
            status: provider.status,
          }));
          setProviders(transformedProviders);
        }

        // Fetch payers
        const payersResponse = await fetch('/api/payers');
        if (payersResponse.ok) {
          const payersData = await payersResponse.json();
          const transformedPayers = payersData.map((payer: any) => ({
            name: payer.name,
            type: payer.type,
            pid: payer.payerId || '',
            rate: payer.avgPayRate || 0,
            visits: payer.visitsPerMonth || 0,
            ar: payer.arDays || 0,
            exp: payer.contractExp ? new Date(payer.contractExp).toISOString().slice(0, 10) : 'N/A',
            status: payer.status,
          }));
          setPayers(transformedPayers);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast('Failed to load data from server', 'te');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (activePage === 'dashboard') {
      const totalBilled = claims.reduce((sum, claim) => sum + claim.billed, 0);
      const totalPaid = payments.reduce((sum, payment) => sum + payment.paid, 0);
      const statusCounts = claims.reduce<Record<string, number>>((acc, claim) => {
        acc[claim.status] = (acc[claim.status] || 0) + 1;
        return acc;
      }, {});
      const agingBars = { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 };
      claims.forEach(claim => {
        if (claim.status !== 'Paid') {
          agingBars[bucket(claim.age)] += claim.bal;
        }
      });
      buildChart('ch-rev', revChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Apr 1', 'Apr 8', 'Apr 15', 'Apr 22', 'Apr 29', 'May 2'],
          datasets: [
            {
              label: 'Billed',
              data: [4200, 3800, 5100, 4700, 6200, 3100],
              type: 'line',
              fill: true,
              backgroundColor: 'rgba(88,166,255,0.15)',
              borderColor: '#58a6ff',
              tension: 0.4,
            },
            {
              label: 'Collected',
              data: [2800, 2600, 3400, 3100, 4100, 2200],
              backgroundColor: 'rgba(63,185,80,0.6)',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8b949e', boxWidth: 10, font: { size: 10 } } },
          },
          scales: {
            x: { ticks: { color: '#8b949e', font: { size: 9 } }, grid: { color: '#21262d' } },
            y: { ticks: { color: '#8b949e', callback: (value: number) => '$' + value / 1000 + 'k', font: { size: 9 } }, grid: { color: '#21262d' } },
          },
        },
      });

      buildChart('ch-status', statusChartRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#3fb950', '#f85149', '#d29922', '#58a6ff', '#bc8cff'], borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#8b949e', boxWidth: 8, font: { size: 10 } } },
          },
        },
      });

      buildChart('ch-aging', agingChartRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(agingBars),
          datasets: [{ data: Object.values(agingBars), backgroundColor: ['#3fb950', '#d29922', '#ffa657', '#f85149'], borderRadius: 5 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#8b949e', font: { size: 9 } }, grid: { display: false } },
            y: { ticks: { color: '#8b949e', font: { size: 9 }, callback: (value: number) => '$' + value }, grid: { color: '#21262d' } },
          },
        },
      });
    }

    if (activePage === 'denial') {
      buildChart('ch-deny', denyChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['CO-97', 'CO-4', 'PR-1', 'CO-50', 'CO-29'],
          datasets: [{ data: [3, 2, 4, 2, 1], backgroundColor: ['#f85149', '#ffa657', '#d29922', '#bc8cff', '#58a6ff'], borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#8b949e', boxWidth: 8, font: { size: 10 } } },
          },
        },
      });

      buildChart('ch-deny-pay', denyPayChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Delta Care', 'Aetna', 'Delta Dental', 'Medicare'],
          datasets: [{ label: 'Denied $', data: [1215, 1740, 760, 450], backgroundColor: ['#f85149', '#ffa657', '#bc8cff', '#58a6ff'], borderRadius: 5 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#8b949e', font: { size: 9 } }, grid: { display: false } },
            y: { ticks: { color: '#8b949e', font: { size: 9 } }, grid: { color: '#21262d' } },
          },
        },
      });
    }

    if (activePage === 'insurance') {
      buildChart('ch-pm', pmChartRef.current, {
        type: 'doughnut',
        data: {
          labels: payers.map(p => p.name),
          datasets: [{ data: payers.map(p => p.visits), backgroundColor: ['#58a6ff', '#3fb950', '#ffa657', '#f85149', '#bc8cff', '#39d353'], borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#8b949e', boxWidth: 8, font: { size: 10 } } },
          },
        },
      });

      buildChart('ch-pr', prChartRef.current, {
        type: 'bar',
        data: {
          labels: payers.map(p => p.name),
          datasets: [{ label: 'Avg Pay Rate %', data: payers.map(p => p.rate), backgroundColor: 'rgba(88,166,255,0.6)', borderColor: '#58a6ff', borderRadius: 5 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#8b949e', font: { size: 9 } }, grid: { display: false } },
            y: { min: 0, max: 100, ticks: { color: '#8b949e', callback: (value: number) => `${value}%`, font: { size: 9 } }, grid: { color: '#21262d' } },
          },
        },
      });
    }

    if (activePage === 'reports') {
      buildChart('ch-trend', trendChartRef.current, {
        type: 'line',
        data: {
          labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [
            { label: 'Billed', data: [28000, 32000, 29000, 35000, 31000, 38000], borderColor: '#58a6ff', tension: 0.4, fill: false, pointRadius: 3 },
            { label: 'Collected', data: [19000, 22000, 20000, 24000, 21000, 26000], borderColor: '#3fb950', tension: 0.4, fill: false, pointRadius: 3 },
            { label: 'Write-offs', data: [2100, 2400, 1900, 2800, 2200, 2600], borderColor: '#f85149', tension: 0.4, fill: false, pointRadius: 3 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#8b949e', boxWidth: 10, font: { size: 10 } } } },
          scales: {
            x: { ticks: { color: '#8b949e', font: { size: 10 } }, grid: { color: '#21262d' } },
            y: { ticks: { color: '#8b949e', callback: (value: number) => '$' + value / 1000 + 'k', font: { size: 10 } }, grid: { color: '#21262d' } },
          },
        },
      });
    }

    if (activePage !== 'dashboard') {
      destroyChart('ch-rev');
      destroyChart('ch-status');
      destroyChart('ch-aging');
    }
    if (activePage !== 'denial') {
      destroyChart('ch-deny');
      destroyChart('ch-deny-pay');
    }
    if (activePage !== 'insurance') {
      destroyChart('ch-pm');
      destroyChart('ch-pr');
    }
    if (activePage !== 'reports') {
      destroyChart('ch-trend');
    }
  }, [activePage, claims, payments, payers, denials]);

  const claimFilter = useMemo(() => {
    const query = String(formData['claimSearch'] || '').trim().toLowerCase();
    const status = String(formData['claimStatus'] || '');
    return claims.filter(claim => {
      const matchesQuery = !query || claim.pt.toLowerCase().includes(query) || claim.id.toLowerCase().includes(query) || claim.pay.toLowerCase().includes(query);
      const matchesStatus = !status || claim.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [claims, formData]);

  const patientFilter = useMemo(() => {
    const query = String(formData['patientSearch'] || '').trim().toLowerCase();
    return patients.filter(patient => {
      const name = `${patient.fn} ${patient.ln}`.toLowerCase();
      return !query || name.includes(query) || patient.id.toLowerCase().includes(query);
    });
  }, [patients, formData]);

  const selectedAppointments = useMemo(() => {
    const prov = String(formData['apptProvFilter'] || '');
    return prov ? appointments.filter(a => a.prov === prov) : appointments;
  }, [appointments, formData]);

  const dashboardAlerts = [
    { type: 'al-e', text: '🔴 2 credentialing applications expiring in <30 days' },
    { type: 'al-w', text: '⚠️ $18,450 in AR over 90 days — 10 claims need follow-up' },
    { type: 'al-i', text: 'ℹ️ 4 prior auth requests pending payer decision' },
  ];

  const dashboardKpis = useMemo(() => {
    const totalBilled = claims.reduce((sum, claim) => sum + claim.billed, 0);
    const totalPaid = payments.reduce((sum, payment) => sum + payment.paid, 0);
    const totalAr = claims.filter(claim => claim.status !== 'Paid').reduce((sum, claim) => sum + claim.bal, 0);
    const denied = claims.filter(claim => claim.status === 'Denied').length;
    return [
      { label: 'Total Billed (MTD)', value: fmt(totalBilled), secondary: '↑ 12% vs last month' },
      { label: 'Collections (MTD)', value: fmt(totalPaid), secondary: `Collection rate: ${Math.round((totalPaid / Math.max(totalBilled, 1)) * 100)}%` },
      { label: 'Total AR', value: fmt(totalAr), secondary: `${claims.filter(claim => claim.status !== 'Paid').length} open claims`, variant: 'kd' },
      { label: 'Denial Rate', value: `${Math.round((denied / Math.max(claims.length, 1)) * 100)}%`, secondary: `${denied} of ${claims.length}`, variant: 'kd' },
      { label: 'Avg AR Days', value: '32', secondary: 'Target: <30 days', variant: 'kd' },
      { label: "Today's Appts", value: String(appointments.length), secondary: '3 arrived, 4 pending' },
      { label: 'Open PA Requests', value: String(priorAuths.filter(pa => pa.status === 'Pending').length), secondary: '2 urgent', variant: 'kd' },
      { label: 'Write-offs (MTD)', value: fmt(writeoffs.reduce((sum, item) => sum + item.amt, 0)), secondary: 'Contractual + charity' },
    ];
  }, [claims, payments, appointments.length, priorAuths, writeoffs]);

  const renderListOptions = patients.map(patient => (
    <option key={patient.id} value={patient.id}>{patient.fn} {patient.ln}</option>
  ));

  const renderProviderOptions = providers.map(provider => (
    <option key={provider.name} value={provider.name}>{provider.name}</option>
  ));

  const renderPayerOptions = payers.map(payer => (
    <option key={payer.name} value={payer.name}>{payer.name}</option>
  ));

  // Function to refresh data from API
  const refreshData = async () => {
    try {
      // Fetch claims
      const claimsResponse = await fetch('/api/claims');
      if (claimsResponse.ok) {
        const claimsData = await claimsResponse.json();
        const transformedClaims = claimsData.map((claim: any) => ({
          id: claim.claimNumber,
          dbId: claim.id, // Store the database ID for API calls
          pt: `${claim.patient.firstName} ${claim.patient.lastName}`,
          dos: new Date(claim.dateOfService).toISOString().slice(0, 10),
          pay: claim.payer.name,
          billed: claim.billedAmount,
          paid: claim.billedAmount - claim.balance,
          bal: claim.balance,
          status: claim.status,
          age: claim.age,
        }));
        setClaims(transformedClaims);
      }

      // Fetch patients
      const patientsResponse = await fetch('/api/patients');
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        const transformedPatients = patientsData.map((patient: any) => ({
          id: patient.mrn,
          fn: patient.firstName,
          ln: patient.lastName,
          dob: new Date(patient.dob).toISOString().slice(0, 10),
          ph: patient.phone || '',
          ins: patient.insurance || '',
          mid: patient.memberId || '',
          bal: patient.balance,
          lv: patient.lastVisit ? new Date(patient.lastVisit).toISOString().slice(0, 10) : '',
        }));
        setPatients(transformedPatients);
      }

      // Fetch providers
      const providersResponse = await fetch('/api/providers');
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        const transformedProviders = providersData.map((provider: any) => ({
          name: provider.name,
          spec: provider.specialty || '',
          npi: provider.npi,
          dea: provider.dea || '',
          rvu: provider.monthlyRVU || 0,
          col: provider.collections || 0,
          cred: 0,
          status: provider.status,
        }));
        setProviders(transformedProviders);
      }

      // Fetch payers
      const payersResponse = await fetch('/api/payers');
      if (payersResponse.ok) {
        const payersData = await payersResponse.json();
        const transformedPayers = payersData.map((payer: any) => ({
          name: payer.name,
          type: payer.type,
          pid: payer.payerId || '',
          rate: payer.avgPayRate || 0,
          visits: payer.visitsPerMonth || 0,
          ar: payer.arDays || 0,
          exp: payer.contractExp ? new Date(payer.contractExp).toISOString().slice(0, 10) : 'N/A',
          status: payer.status,
        }));
        setPayers(transformedPayers);
      }

    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const dashboardPayerBars = useMemo(() => {
    const counts = claims.reduce<Record<string, number>>((acc, claim) => {
      acc[claim.pay] = (acc[claim.pay] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [claims]);

  const addClaim = async () => {
    try {
      console.log('Form data:', formData);
      console.log('Patients:', patients);
      console.log('Providers:', providers);
      console.log('Payers:', payers);

      // Find patient and provider IDs from the form data
      const patient = patients.find(p => p.id === formData['cl-pt']);
      const provider = providers.find(p => p.name === formData['cl-prov']);
      const payer = payers.find(p => p.name === formData['cl-pay']);

      console.log('Found patient:', patient);
      console.log('Found provider:', provider);
      console.log('Found payer:', payer);

      if (!patient || !provider || !payer) {
        toast('Invalid patient, provider, or payer selected', 'te');
        return;
      }

      const claimData = {
        claimNumber: `CLM-${Date.now()}`, // Generate a unique claim number
        practiceId: 'cmovb28l40000k8vfc94edb07', // The actual practice ID from seeded data
        patientId: patient.id,
        providerId: provider.npi, // Using NPI as the ID
        payerId: payer.name, // Using name as ID for now
        dateOfService: formData['cl-dos'] || today(),
        billedAmount: Number(formData['cl-amt'] || 0),
        cptCode: formData['cl-cpt'] || 'D0120',
        icdCode: formData['cl-icd'] || 'K02.9',
        units: 1,
        posCode: '11',
      };

      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(claimData),
      });

      if (response.ok) {
        const newClaim = await response.json();
        // Transform the API response to match frontend format
        const transformedClaim = {
          id: newClaim.claimNumber,
          dbId: newClaim.id,
          pt: `${newClaim.patient.firstName} ${newClaim.patient.lastName}`,
          dos: new Date(newClaim.dateOfService).toISOString().slice(0, 10),
          pay: newClaim.payer.name,
          billed: newClaim.billedAmount,
          paid: newClaim.billedAmount - newClaim.balance,
          bal: newClaim.balance,
          status: newClaim.status,
          age: newClaim.age,
        };

        setClaims(prev => [transformedClaim, ...prev]);
        setModal(null);
        toast(`Claim ${newClaim.claimNumber} submitted`, 'ts');
        // Refresh data to ensure all clients are in sync
        await refreshData();
      } else {
        const error = await response.json();
        toast(`Failed to create claim: ${error.error}`, 'te');
      }
    } catch (error) {
      console.error('Error creating claim:', error);
      toast('Failed to create claim', 'te');
    }
  };

  const addAppointment = () => {
    const patient = patients.find(p => p.id === formData['ap-pt']);
    setAppointments(prev => [
      {
        time: formData['ap-time'] || '09:00',
        pt: patient ? `${patient.fn} ${patient.ln}` : 'New Patient',
        dob: patient?.dob || '—',
        prov: formData['ap-prov'] || 'Dr. Smith',
        type: formData['ap-type'] || 'New Patient',
        ins: formData['ap-ins'] || 'Delta Care',
        vob: String(formData['ap-vob'] || '✅').split(' ')[0],
        cop: '$0',
        status: 'Confirmed',
      },
      ...appointments,
    ]);
    setModal(null);
    toast('Appointment scheduled', 'ts');
  };

  const addPay = () => {
    setPayments(prev => [
      {
        date: formData['py-date'] || today(),
        cl: formData['py-cl'] || 'CLM-NEW',
        pt: 'Patient',
        pay: formData['py-pay'] || 'Insurance',
        billed: Number(formData['py-billed'] || 0),
        allowed: Number(formData['py-allowed'] || 0),
        adj: Number(formData['py-adj'] || 0),
        paid: Number(formData['py-paid'] || 0),
        pr: Number(formData['py-pr'] || 0),
        type: `${formData['py-type'] || 'Insurance'} EFT`,
      },
      ...payments,
    ]);
    setModal(null);
    toast('Payment posted', 'ts');
  };

  const addWriteoff = () => {
    const patient = patients.find(p => p.id === formData['wo-pt']);
    setWriteoffs(prev => [
      {
        date: formData['wo-date'] || today(),
        cl: formData['wo-cl'] || 'CLM-NEW',
        pt: patient ? `${patient.fn} ${patient.ln}` : '—',
        pay: formData['wo-pay'] || 'Self-Pay',
        amt: Number(formData['wo-amt'] || 0),
        cat: formData['wo-cat'] || 'Contractual Adjustment',
        auth: formData['wo-auth'] || 'Admin',
        reason: formData['wo-reason'] || '—',
      },
      ...writeoffs,
    ]);
    setModal(null);
    toast('Write-off posted', 'ts');
  };

  const addPayer = () => {
    setPayers(prev => [
      {
        name: formData['pay-name'] || 'New Payer',
        type: formData['pay-type'] || 'Commercial',
        pid: formData['pay-id'] || '—',
        rate: Number(formData['pay-rate'] || 70),
        visits: Number(formData['pay-visits'] || 0),
        ar: Number(formData['pay-ar'] || 30),
        exp: formData['pay-exp'] || 'N/A',
        status: 'Active',
      },
      ...payers,
    ]);
    setModal(null);
    toast('Payer added', 'ts');
  };

  const addVOB = () => {
    const patient = patients.find(p => p.id === formData['vob-pt']);
    setVobs(prev => [
      {
        pt: patient ? `${patient.fn} ${patient.ln}` : 'New Patient',
        pay: formData['vob-pay'] || 'Delta Care',
        mid: formData['vob-mid'] || '—',
        appt: formData['vob-dos'] || today(),
        ded: Number(formData['vob-ded'] || 0),
        met: Number(formData['vob-dmet'] || 0),
        cop: Number(formData['vob-cop'] || 0),
        coins: `${formData['vob-coins'] || '0'}%`,
        auth: formData['vob-auth'] || 'No',
        status: 'Pending',
      },
      ...vobs,
    ]);
    setModal(null);
    toast('VOB saved', 'ts');
  };

  const addPA = () => {
    const id = `PA-${(priorAuths.length + 1).toString().padStart(3, '0')}`;
    const patient = patients.find(p => p.id === formData['pa-pt']);
    setPriorAuths(prev => [
      {
        id,
        pt: patient ? `${patient.fn} ${patient.ln}` : 'Patient',
        pay: formData['pa-pay'] || 'Delta Care',
        svc: formData['pa-svc'] || 'Service',
        req: today(),
        units: Number(formData['pa-units'] || 1),
        appr: 0,
        exp: formData['pa-end'] || '—',
        status: 'Pending',
      },
      ...prev,
    ]);
    setModal(null);
    toast(`PA ${id} submitted`, 'ts');
  };

  const addCred = () => {
    setCredentialing(prev => [
      {
        prov: formData['cr-prov'] || 'Dr. Smith',
        pay: formData['cr-pay'] || 'Delta Care',
        npi: formData['cr-npi'] || '—',
        sub: formData['cr-sub'] || today(),
        eff: formData['cr-eff'] || today(),
        exp: formData['cr-exp'] || today(),
        days: 365,
        status: 'Active',
      },
      ...prev,
    ]);
    setModal(null);
    toast('Credentialing application saved', 'ts');
  };

  const addProvider = () => {
    setProviders(prev => [
      {
        name: formData['pv-name'] || 'Dr. New',
        spec: formData['pv-spec'] || 'General Dentistry',
        npi: formData['pv-npi'] || '—',
        dea: formData['pv-dea'] || '—',
        rvu: Number(formData['pv-rvu'] || 0),
        col: 0,
        cred: 0,
        status: 'Active',
      },
      ...prev,
    ]);
    setModal(null);
    toast('Provider added', 'ts');
  };

  const savePatient = () => {
    const fn = formData['pt-fn'] || 'New';
    const ln = formData['pt-ln'] || 'Patient';
    const patient: Patient = {
      id: patientEditIndex !== null ? patients[patientEditIndex].id : `P${(patients.length + 1).toString().padStart(3, '0')}`,
      fn,
      ln,
      dob: formData['pt-dob'] || '—',
      ph: formData['pt-ph'] || '—',
      ins: formData['pt-ins'] || 'Delta Care',
      mid: formData['pt-mid'] || '—',
      bal: patientEditIndex !== null ? patients[patientEditIndex].bal : 0,
      lv: patientEditIndex !== null ? patients[patientEditIndex].lv : today(),
    };
    if (patientEditIndex !== null) {
      setPatients(prev => prev.map((item, index) => (index === patientEditIndex ? patient : item)));
      toast('Patient updated', 'ts');
    } else {
      setPatients(prev => [patient, ...prev]);
      toast(`Patient ${fn} ${ln} created`, 'ts');
    }
    setModal(null);
    setPatientEditIndex(null);
  };

  const editPatient = (index: number) => {
    const patient = patients[index];
    setPatientEditIndex(index);
    setFormData({
      'pt-fn': patient.fn,
      'pt-ln': patient.ln,
      'pt-dob': patient.dob === '—' ? '' : patient.dob,
      'pt-ph': patient.ph,
      'pt-ins': patient.ins,
      'pt-mid': patient.mid === '—' ? '' : patient.mid,
    });
    setModal('m-patient');
  };

  const deletePatient = (index: number) => {
    setPatients(prev => prev.filter((_, idx) => idx !== index));
    toast('Patient removed', 'te');
  };

  const switchPractice = (practiceName: string) => {
    setPracticeName(practiceName);
    setModal(null);
    toast(`Switched to ${practiceName}`, 'ts');
  };

  const addPractice = () => {
    const name = formData['np-name'] || 'New Practice';
    const type = formData['np-type'] || 'Dental';
    const npi = formData['np-npi'] || 'TBD';
    setPractices(prev => [...prev, { id: prev.length + 1, name, type, npi }]);
    setPracticeName(name);
    setModal(null);
    toast(`Practice "${name}" created!`, 'ts');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div className="page act" id="pg-dashboard">
            <div className="ph">
              <div>
                <h1>Revenue Command Center</h1>
                <p id="dash-sub">Real-time snapshot · synced now</p>
              </div>
              <div className="pa">
                <select className="btn" style={{ padding: '5px 8px' }} value={formData['dash-period'] || 'This Month'} onChange={e => setFormData(prev => ({ ...prev, 'dash-period': e.target.value }))}>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>YTD</option>
                </select>
                <button className="btn btn-p" type="button" onClick={() => openModal('m-claim')}>
                  + New Claim
                </button>
              </div>
            </div>
            <div className="content">
              {dashboardAlerts.map(alert => (
                <div key={alert.text} className={`al ${alert.type}`}>{alert.text}</div>
              ))}
              <div className="kg" id="d-kpis">
                {dashboardKpis.map(k => (
                  <div key={k.label} className="kc">
                    <div className="kl">{k.label}</div>
                    <div className="kv">{k.value}</div>
                    <div className={`ks ${k.variant || ''}`}>{k.secondary}</div>
                  </div>
                ))}
              </div>
              <div className="gc" style={{ marginBottom: 14 }}>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch">
                    <span className="ct">Revenue Flow (30d)</span>
                    <span style={{ fontSize: 10, color: 'var(--tx2)' }}>Billed → Collected</span>
                  </div>
                  <div className="cb">
                    <canvas ref={revChartRef} height={150} />
                  </div>
                </div>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch">
                    <span className="ct">Claim Status Mix</span>
                  </div>
                  <div className="cb">
                    <canvas ref={statusChartRef} height={150} />
                  </div>
                </div>
              </div>
              <div className="g2" style={{ marginBottom: 14 }}>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch">
                    <span className="ct">Payer Mix (Visits)</span>
                    <button className="btn btn-sm" type="button" onClick={() => setActivePage('insurance')}>
                      All
                    </button>
                  </div>
                  <div className="cb" id="d-payer">
                    {dashboardPayerBars.map(([payer, count]) => {
                      const pct = Math.round((count / Math.max(claims.length, 1)) * 100);
                      return (
                        <div key={payer} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span>{payer}</span>
                            <span style={{ color: 'var(--tx2)' }}>{count} claims ({pct}%)</span>
                          </div>
                          <div className="pb">
                            <div className="pf" style={{ width: `${pct}%`, background: 'var(--ac)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch">
                    <span className="ct">AR Aging Summary</span>
                    <button className="btn btn-sm" type="button" onClick={() => setActivePage('aging')}>
                      Detail
                    </button>
                  </div>
                  <div className="cb">
                    <canvas ref={agingChartRef} height={130} />
                  </div>
                </div>
              </div>
              <div className="g3">
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch"><span className="ct">🚫 Top Denials</span></div>
                  <div className="cb">
                    {[
                      { label: 'CO-97 Bundled', count: 3 },
                      { label: 'CO-4 Modifier', count: 2 },
                      { label: 'PR-1 Deductible', count: 4 },
                      { label: 'CO-50 Non-covered', count: 2 },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--b1)', fontSize: 11 }}>
                        <span>{item.label}</span>
                        <span className="badge br">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch"><span className="ct">🔐 PA Queue</span></div>
                  <div className="cb">
                    {priorAuths.slice(0, 4).map(item => (
                      <div key={item.id} style={{ padding: '5px 0', borderBottom: '1px solid var(--b1)', fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{item.pt}</span>
                          <span className={badgeClass(item.status)}>{item.status}</span>
                        </div>
                        <div style={{ color: 'var(--tx2)', marginTop: 1 }}>{item.pay} · {item.svc.slice(0, 22)}…</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch"><span className="ct">📅 Today's Schedule</span></div>
                  <div className="cb">
                    {appointments.slice(0, 5).map((appointment, index) => (
                      <div key={`${appointment.time}-${index}`} style={{ display: 'flex', gap: 7, padding: '5px 0', borderBottom: '1px solid var(--b1)', fontSize: 11 }}>
                        <span style={{ color: 'var(--ac)', fontFamily: 'var(--mn)', width: 40, flexShrink: 0 }}>{appointment.time}</span>
                        <div>
                          <div style={{ fontWeight: 500 }}>{appointment.pt}</div>
                          <div style={{ color: 'var(--tx2)' }}>{appointment.type} · {appointment.vob}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'scheduling':
        return (
          <div className="page act" id="pg-scheduling">
            <div className="ph">
              <div>
                <h1>Scheduling</h1>
                <p>Appointments, VOB status & patient flow</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => openModal('m-appt')}>
                  + New Appointment
                </button>
              </div>
            </div>
            <div className="content">
              <div className="card">
                <div className="ch">
                  <span className="ct">Today's Appointments</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select className="btn btn-sm" value={formData['apptProvFilter'] || ''} onChange={e => setFormData(prev => ({ ...prev, apptProvFilter: e.target.value }))}>
                      <option value="">All Providers</option>
                      <option>Dr. Smith</option>
                      <option>Dr. Jones</option>
                    </select>
                  </div>
                </div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Patient</th>
                        <th>DOB</th>
                        <th>Provider</th>
                        <th>Type</th>
                        <th>Insurance</th>
                        <th>VOB</th>
                        <th>Copay</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAppointments.map((appointment, index) => (
                        <tr key={`${appointment.time}-${index}`}>
                          <td className="mono" style={{ color: 'var(--ac)' }}>{appointment.time}</td>
                          <td style={{ fontWeight: 500 }}>{appointment.pt}</td>
                          <td style={{ color: 'var(--tx2)' }}>{appointment.dob}</td>
                          <td>{appointment.prov}</td>
                          <td>{appointment.type}</td>
                          <td>{appointment.ins}</td>
                          <td style={{ fontSize: 16, textAlign: 'center' }}>{appointment.vob}</td>
                          <td style={{ color: 'var(--ac3)' }}>{appointment.cop}</td>
                          <td><span className={badgeClass(appointment.status)}>{appointment.status}</span></td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs btn-p" type="button" onClick={() => openModal('m-vob')}>
                                VOB
                              </button>
                              <button className="btn btn-xs" type="button" onClick={() => toast(`Edit appointment ${index + 1}`, 'ti')}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => {
                                setAppointments(prev => prev.filter((_, idx) => idx !== index));
                                toast('Appointment cancelled', 'te');
                              }}>
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'claims':
        return (
          <div className="page act" id="pg-claims">
            <div className="ph">
              <div>
                <h1>Claims Management</h1>
                <p>Create · Submit · Track · Reconcile</p>
              </div>
              <div className="pa">
                <button className="btn btn-sm" type="button" onClick={() => openModal('m-ch')}>
                  🔗 Clearinghouse
                </button>
                <button className="btn btn-p" type="button" onClick={() => openModal('m-claim')}>
                  + New Claim
                </button>
              </div>
            </div>
            <div className="content">
              <div className="kg" id="cl-kpis">
                {[
                  { label: 'Total Billed', value: fmt(claims.reduce((sum, claim) => sum + claim.billed, 0)), accent: false },
                  { label: 'Total Paid', value: fmt(payments.reduce((sum, payment) => sum + payment.paid, 0)), accent: true },
                  { label: 'Open AR', value: fmt(claims.filter(claim => claim.status !== 'Paid').reduce((sum, claim) => sum + claim.bal, 0)), accent: false },
                  { label: 'Denied Claims', value: String(claims.filter(claim => claim.status === 'Denied').length), accent: false },
                ].map(item => (
                  <div key={item.label} className="kc">
                    <div className="kl">{item.label}</div>
                    <div className={`kv ${item.accent ? 'ku' : ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="ch">
                  <span className="ct">All Claims</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <div className="srch" style={{ width: 200 }}>
                      <span>🔍</span>
                      <input
                        placeholder="Search..."
                        value={formData['claimSearch'] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, claimSearch: e.target.value }))}
                      />
                    </div>
                    <select
                      className="btn btn-sm"
                      value={formData['claimStatus'] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, claimStatus: e.target.value }))}
                    >
                      <option value="">All Status</option>
                      <option>Submitted</option>
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Denied</option>
                      <option>Resubmitted</option>
                    </select>
                  </div>
                </div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Claim#</th>
                        <th>Patient</th>
                        <th>DOS</th>
                        <th>Payer</th>
                        <th>Billed</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Age</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claimFilter.map(claim => (
                        <tr key={claim.id}>
                          <td className="mono" style={{ color: 'var(--ac)' }}>{claim.id}</td>
                          <td style={{ fontWeight: 500 }}>{claim.pt}</td>
                          <td>{claim.dos}</td>
                          <td>{claim.pay}</td>
                          <td>{fmt(claim.billed)}</td>
                          <td style={{ color: 'var(--grn)' }}>{fmt(claim.paid)}</td>
                          <td style={{ color: claim.bal > 0 ? 'var(--red)' : 'var(--grn)' }}>{fmt(claim.bal)}</td>
                          <td><span className={badgeClass(claim.status)}>{claim.status}</span></td>
                          <td><span className={`badge ${ageBadgeClass(claim.age)}`}>{claim.age}d</span></td>
                          <td>
                            <div className="ac-cell">
                              <button
                                className="btn btn-xs"
                                type="button"
                                onClick={() => toast(`Editing claim ${claim.id}`, 'ti')}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-xs btn-d"
                                type="button"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/claims/${claim.dbId}`, {
                                      method: 'DELETE',
                                    });

                                    if (response.ok) {
                                      toast('Claim deleted', 'ts');
                                      await refreshData(); // Refresh data to sync across all clients
                                    } else {
                                      const error = await response.json();
                                      toast(`Failed to delete claim: ${error.error}`, 'te');
                                    }
                                  } catch (error) {
                                    console.error('Error deleting claim:', error);
                                    toast('Failed to delete claim', 'te');
                                  }
                                }}
                              >
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'denial':
        return (
          <div className="page act" id="pg-denial">
            <div className="ph">
              <div>
                <h1>Denial Management</h1>
                <p>Track · Appeal · Recover</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => openModal('m-appeal')}>
                  + File Appeal
                </button>
              </div>
            </div>
            <div className="content">
              <div className="kg" id="dn-kpis">
                {[
                  { label: 'Total Denied', value: fmt(denials.reduce((sum, item) => sum + item.amt, 0)), accent: true },
                  { label: 'Denial Count', value: String(denials.length) },
                  { label: 'Appeals Filed', value: String(denials.filter(item => item.appeal !== 'Not Filed').length), accent: true },
                  { label: 'Recovery Rate', value: '34%' },
                ].map(item => (
                  <div key={item.label} className="kc">
                    <div className="kl">{item.label}</div>
                    <div className={`kv ${item.accent ? 'ku' : ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="g2" style={{ marginBottom: 14 }}>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch"><span className="ct">Denial Reasons</span></div>
                  <div className="cb">
                    <canvas ref={denyChartRef} height={150} />
                  </div>
                </div>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch"><span className="ct">By Payer</span></div>
                  <div className="cb">
                    <canvas ref={denyPayChartRef} height={150} />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Denied Claims Queue</span></div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Claim#</th>
                        <th>Patient</th>
                        <th>Payer</th>
                        <th>Amount</th>
                        <th>Code</th>
                        <th>Reason</th>
                        <th>Days</th>
                        <th>Appeal</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {denials.map((denial, index) => (
                        <tr key={denial.cl}>
                          <td className="mono" style={{ color: 'var(--ac)' }}>{denial.cl}</td>
                          <td style={{ fontWeight: 500 }}>{denial.pt}</td>
                          <td>{denial.pay}</td>
                          <td style={{ color: 'var(--red)' }}>{fmt(denial.amt)}</td>
                          <td className="mono">{denial.code}</td>
                          <td>{denial.reason}</td>
                          <td><span className={`badge ${ageBadgeClass(denial.days)}`}>{denial.days}d</span></td>
                          <td><span className={badgeClass(denial.appeal)}>{denial.appeal}</span></td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs btn-p" type="button" onClick={() => openModal('m-appeal')}>
                                Appeal
                              </button>
                              <button className="btn btn-xs" type="button" onClick={() => toast('Editing denial record', 'ti')}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => setDenials(prev => prev.filter((_, idx) => idx !== index))}>
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'aging':
        const agingRows = Array.from(new Set(claims.filter(claim => claim.status !== 'Paid').map(claim => claim.pay))).map(pay => {
          const buckets = ['0-30', '31-60', '61-90', '>90'].map(bucketName => {
            const value = claims.filter(claim => claim.pay === pay && claim.status !== 'Paid' && bucket(claim.age) === bucketName).reduce((sum, claim) => sum + claim.bal, 0);
            return { bucketName, value };
          });
          return { pay, buckets, total: buckets.reduce((sum, item) => sum + item.value, 0) };
        });
        return (
          <div className="page act" id="pg-aging">
            <div className="ph">
              <div>
                <h1>Claim Aging</h1>
                <p>AR aging buckets by payer</p>
              </div>
            </div>
            <div className="content">
              {claims.filter(claim => claim.status !== 'Paid' && claim.age > 90).length > 0 && (
                <div className="al al-e">
                  🔴 {fmt(claims.filter(claim => claim.status !== 'Paid' && claim.age > 90).reduce((sum, claim) => sum + claim.bal, 0))} in claims over 90 days — immediate action required
                </div>
              )}
              <div className="card">
                <div className="ch"><span className="ct">AR Aging by Payer</span></div>
                <div className="cb">
                  <div className="ar" style={{ background: 'none', borderRadius: 0 }}>
                    <div className="acel lbl" style={{ fontSize: 10, color: 'var(--tx2)' }}>PAYER</div>
                    {['0-30', '31-60', '61-90', '>90'].map(label => (
                      <div key={label} className="acel" style={{ fontSize: 10, color: 'var(--tx2)', textAlign: 'center' }}>{label}</div>
                    ))}
                    <div className="acel" style={{ fontSize: 10, color: 'var(--tx2)' }}>TOTAL</div>
                  </div>
                  {agingRows.map(row => (
                    <div key={row.pay} className="ar">
                      <div className="acel lbl" style={{ textAlign: 'left', fontWeight: 500, color: 'var(--tx)' }}>{row.pay}</div>
                      {row.buckets.map((bucketValue, index) => (
                        <div key={index} className={`acel ${bucketValue.value > 5000 ? 'h4c' : bucketValue.value > 2000 ? 'h3c' : bucketValue.value > 500 ? 'h2c' : bucketValue.value > 0 ? 'h1c' : ''}`} style={{ textAlign: 'center' }}>
                          {bucketValue.value ? fmt(bucketValue.value) : '—'}
                        </div>
                      ))}
                      <div className="acel" style={{ fontWeight: 600, textAlign: 'right' }}>{fmt(row.total)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Aging Detail</span></div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Claim#</th>
                        <th>Patient</th>
                        <th>Payer</th>
                        <th>DOS</th>
                        <th>Billed</th>
                        <th>Balance</th>
                        <th>Age</th>
                        <th>Bucket</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.filter(claim => claim.status !== 'Paid').sort((a, b) => b.age - a.age).map(claim => (
                        <tr key={claim.id}>
                          <td className="mono" style={{ color: 'var(--ac)' }}>{claim.id}</td>
                          <td>{claim.pt}</td>
                          <td>{claim.pay}</td>
                          <td>{claim.dos}</td>
                          <td>{fmt(claim.billed)}</td>
                          <td style={{ color: 'var(--red)' }}>{fmt(claim.bal)}</td>
                          <td><span className={`badge ${ageBadgeClass(claim.age)}`}>{claim.age}d</span></td>
                          <td><span className="badge">{bucket(claim.age)}</span></td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs btn-p" type="button" onClick={() => openModal('m-appeal')}>
                                Follow-up
                              </button>
                              <button className="btn btn-xs" type="button" onClick={() => openModal('m-pay')}>
                                Post Pay
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="page act" id="pg-payments">
            <div className="ph">
              <div>
                <h1>Payments & EOB</h1>
                <p>Post payments, ERAs & patient responsibility</p>
              </div>
              <div className="pa">
                <button className="btn" type="button" onClick={() => openModal('m-era')}>
                  📄 Post ERA
                </button>
                <button className="btn btn-p" type="button" onClick={() => openModal('m-pay')}>
                  + Post Payment
                </button>
              </div>
            </div>
            <div className="content">
              <div className="kg" id="py-kpis">
                {[
                  { label: 'Total Collected', value: fmt(payments.reduce((sum, item) => sum + item.paid, 0)), accent: true },
                  { label: 'Contractual Adj', value: fmt(payments.reduce((sum, item) => sum + item.adj, 0)) },
                  { label: 'Pt Responsibility', value: fmt(payments.reduce((sum, item) => sum + item.pr, 0)) },
                  { label: 'ERAs Pending', value: '3' },
                ].map(item => (
                  <div key={item.label} className="kc">
                    <div className="kl">{item.label}</div>
                    <div className={`kv ${item.accent ? 'ku' : ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Payment Ledger</span></div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Claim#</th>
                        <th>Patient</th>
                        <th>Payer</th>
                        <th>Billed</th>
                        <th>Allowed</th>
                        <th>Adj</th>
                        <th>Paid</th>
                        <th>Pt Resp</th>
                        <th>Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, index) => (
                        <tr key={`${payment.date}-${index}`}>
                          <td>{payment.date}</td>
                          <td className="mono" style={{ color: 'var(--ac)' }}>{payment.cl}</td>
                          <td>{payment.pt}</td>
                          <td>{payment.pay}</td>
                          <td>{fmt(payment.billed)}</td>
                          <td>{fmt(payment.allowed)}</td>
                          <td style={{ color: 'var(--yel)' }}>-{fmt(payment.adj)}</td>
                          <td style={{ color: 'var(--grn)', fontWeight: 600 }}>{fmt(payment.paid)}</td>
                          <td style={{ color: payment.pr > 0 ? 'var(--ac3)' : 'var(--tx2)' }}>{fmt(payment.pr)}</td>
                          <td><span className="badge bb">{payment.type}</span></td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs" type="button" onClick={() => toast('Viewing EOB', 'ti')}>
                                EOB
                              </button>
                              <button className="btn btn-xs" type="button" onClick={() => toast('Edit payment record', 'ti')}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => setPayments(prev => prev.filter((_, idx) => idx !== index))}>
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'writeoffs':
        return (
          <div className="page act" id="pg-writeoffs">
            <div className="ph">
              <div>
                <h1>Write-offs & Adjustments</h1>
                <p>Contractual · Charity · Bad Debt</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => openModal('m-wo')}>
                  + New Write-off
                </button>
              </div>
            </div>
            <div className="content">
              <div className="kg" id="wo-kpis">
                {[
                  { label: 'Total Write-offs (MTD)', value: fmt(writeoffs.reduce((sum, item) => sum + item.amt, 0)), accent: true },
                  { label: 'Contractual', value: fmt(writeoffs.filter(item => item.cat === 'Contractual Adjustment').reduce((sum, item) => sum + item.amt, 0)) },
                  { label: 'Charity Care', value: fmt(writeoffs.filter(item => item.cat === 'Charity Care').reduce((sum, item) => sum + item.amt, 0)) },
                  { label: 'Bad Debt', value: '$0' },
                ].map(item => (
                  <div key={item.label} className="kc">
                    <div className="kl">{item.label}</div>
                    <div className={`kv ${item.accent ? 'kd' : ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Write-off Register</span></div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Claim#</th>
                        <th>Patient</th>
                        <th>Payer</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Auth By</th>
                        <th>Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {writeoffs.map((item, index) => (
                        <tr key={`${item.cl}-${index}`}>
                          <td>{item.date}</td>
                          <td className="mono" style={{ color: 'var(--ac)' }}>{item.cl}</td>
                          <td>{item.pt}</td>
                          <td>{item.pay}</td>
                          <td style={{ color: 'var(--red)' }}>{fmt(item.amt)}</td>
                          <td><span className="badge bp">{item.cat}</span></td>
                          <td>{item.auth}</td>
                          <td style={{ color: 'var(--tx2)', fontSize: 11 }}>{item.reason}</td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs" type="button" onClick={() => toast('Editing write-off', 'ti')}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => setWriteoffs(prev => prev.filter((_, idx) => idx !== index))}>
                                Void
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'insurance':
        return (
          <div className="page act" id="pg-insurance">
            <div className="ph">
              <div>
                <h1>Payer Mix & Analysis</h1>
                <p>Foot traffic, rates & AR by payer</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => openModal('m-payer')}>
                  + Add Payer
                </button>
              </div>
            </div>
            <div className="content">
              <div className="g2" style={{ marginBottom: 14 }}>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch"><span className="ct">Payer Mix (Visits)</span></div>
                  <div className="cb"><canvas ref={pmChartRef} height={170} /></div>
                </div>
                <div className="card" style={{ margin: 0 }}>
                  <div className="ch"><span className="ct">Avg Pay Rate %</span></div>
                  <div className="cb"><canvas ref={prChartRef} height={170} /></div>
                </div>
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Payer Contracts</span></div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Payer</th>
                        <th>Type</th>
                        <th>Payer ID</th>
                        <th>Avg Pay Rate</th>
                        <th>Visits/mo</th>
                        <th>AR Days</th>
                        <th>Contract Exp</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payers.map((payer, index) => (
                        <tr key={`${payer.name}-${index}`}>
                          <td style={{ fontWeight: 600 }}>{payer.name}</td>
                          <td>{payer.type}</td>
                          <td className="mono">{payer.pid}</td>
                          <td style={{ color: 'var(--grn)' }}>{payer.rate}%</td>
                          <td>{payer.visits}</td>
                          <td><span className={`badge ${payer.ar > 45 ? 'br' : payer.ar > 30 ? 'by' : 'bg'}`}>{payer.ar}d</span></td>
                          <td>{payer.exp}</td>
                          <td><span className={badgeClass(payer.status)}>{payer.status}</span></td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs" type="button" onClick={() => toast('Editing payer', 'ti')}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => setPayers(prev => prev.filter((_, idx) => idx !== index))}>
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'vob':
        return (
          <div className="page act" id="pg-vob">
            <div className="ph">
              <div>
                <h1>VOB / Eligibility</h1>
                <p>Verify benefits before service</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => openModal('m-vob')}>
                  + New VOB
                </button>
              </div>
            </div>
            <div className="content">
              {vobs.filter(item => item.status !== 'Verified').length > 0 && (
                <div className="al al-w">⚠️ {vobs.filter(item => item.status !== 'Verified').length} patient(s) scheduled today without verified benefits</div>
              )}
              <div className="kg" id="vob-kpis">
                {[
                  { label: 'Verified Today', value: String(vobs.filter(item => item.status === 'Verified').length), accent: true },
                  { label: 'Pending', value: String(vobs.filter(item => item.status === 'Pending').length), accent: false },
                  { label: 'Auth Required', value: String(vobs.filter(item => item.auth === 'Yes').length) },
                  { label: 'Avg Deductible', value: fmt(Math.round(vobs.reduce((sum, item) => sum + item.ded, 0) / Math.max(vobs.length, 1))) },
                ].map(item => (
                  <div key={item.label} className="kc">
                    <div className="kl">{item.label}</div>
                    <div className={`kv ${item.accent ? 'ku' : ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="ch"><span className="ct">VOB Queue</span></div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Payer</th>
                        <th>Member ID</th>
                        <th>Appt</th>
                        <th>Deductible</th>
                        <th>Met</th>
                        <th>Copay</th>
                        <th>Coins</th>
                        <th>Auth Req</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vobs.map((item, index) => (
                        <tr key={`${item.pt}-${index}`}>
                          <td style={{ fontWeight: 500 }}>{item.pt}</td>
                          <td>{item.pay}</td>
                          <td className="mono">{item.mid}</td>
                          <td>{item.appt}</td>
                          <td>{fmt(item.ded)}</td>
                          <td>{fmt(item.met)}</td>
                          <td>${item.cop}</td>
                          <td>{item.coins}</td>
                          <td><span className={`badge ${item.auth === 'Yes' ? 'by' : 'bg'}`}>{item.auth}</span></td>
                          <td><span className={badgeClass(item.status)}>{item.status}</span></td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs btn-p" type="button" onClick={() => {
                                setVobs(prev => prev.map((value, idx) => idx === index ? { ...value, status: 'Verified' } : value));
                                toast('Benefits verified via Availity', 'ts');
                              }}>
                                Re-verify
                              </button>
                              <button className="btn btn-xs" type="button" onClick={() => toast('Editing VOB record', 'ti')}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => setVobs(prev => prev.filter((_, idx) => idx !== index))}>
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'priorauth':
        return (
          <div className="page act" id="pg-priorauth">
            <div className="ph">
              <div>
                <h1>Prior Authorizations</h1>
                <p>Request · Track · Manage pre-auths</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => openModal('m-pa')}>
                  + New PA Request
                </button>
              </div>
            </div>
            <div className="content">
              <div className="kg" id="pa-kpis">
                {[
                  { label: 'Approved', value: String(priorAuths.filter(item => item.status === 'Approved').length), accent: true },
                  { label: 'Pending', value: String(priorAuths.filter(item => item.status === 'Pending').length), accent: false },
                  { label: 'Partial', value: String(priorAuths.filter(item => item.status === 'Partial').length) },
                  { label: 'Expiring 30d', value: '1', accent: false },
                ].map(item => (
                  <div key={item.label} className="kc">
                    <div className="kl">{item.label}</div>
                    <div className={`kv ${item.accent ? 'ku' : ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Authorization Tracker</span></div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>PA#</th>
                        <th>Patient</th>
                        <th>Payer</th>
                        <th>Service</th>
                        <th>Requested</th>
                        <th>Units Req</th>
                        <th>Units Appr</th>
                        <th>Exp Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priorAuths.map((item, index) => (
                        <tr key={item.id}>
                          <td className="mono" style={{ color: 'var(--ac)' }}>{item.id}</td>
                          <td style={{ fontWeight: 500 }}>{item.pt}</td>
                          <td>{item.pay}</td>
                          <td style={{ fontSize: 11 }}>{item.svc}</td>
                          <td>{item.req}</td>
                          <td>{item.units}</td>
                          <td style={{ color: 'var(--grn)' }}>{item.appr || '—'}</td>
                          <td>{item.exp}</td>
                          <td><span className={badgeClass(item.status)}>{item.status}</span></td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs" type="button" onClick={() => toast('Edit PA', 'ti')}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => setPriorAuths(prev => prev.filter((_, idx) => idx !== index))}>
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'credentialing':
        return (
          <div className="page act" id="pg-credentialing">
            <div className="ph">
              <div>
                <h1>Credentialing</h1>
                <p>Provider enrollment & payer status</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => openModal('m-cred')}>
                  + New Application
                </button>
              </div>
            </div>
            <div className="content">
              {credentialing.filter(item => item.days < 30).length > 0 && (
                <div className="al al-e">🔴 {credentialing.filter(item => item.days < 30).length} credentialing applications expiring in {'<30'} days</div>
              )}
              <div className="kg" id="cr-kpis">
                {[
                  { label: 'Active', value: String(credentialing.filter(item => item.status === 'Active').length), accent: true },
                  { label: 'Expiring Soon', value: String(credentialing.filter(item => item.status === 'Expiring Soon').length), accent: false },
                  { label: 'Providers', value: String(new Set(credentialing.map(item => item.prov)).size) },
                  { label: 'Payers Enrolled', value: String(credentialing.length) },
                ].map(item => (
                  <div key={item.label} className="kc">
                    <div className="kl">{item.label}</div>
                    <div className={`kv ${item.accent ? 'ku' : ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Credentialing Tracker</span></div>
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Provider</th>
                        <th>Payer</th>
                        <th>NPI</th>
                        <th>Submitted</th>
                        <th>Effective</th>
                        <th>Exp Date</th>
                        <th>Days Left</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credentialing.map((item, index) => (
                        <tr key={`${item.prov}-${index}`}>
                          <td style={{ fontWeight: 600 }}>{item.prov}</td>
                          <td>{item.pay}</td>
                          <td className="mono">{item.npi}</td>
                          <td>{item.sub}</td>
                          <td>{item.eff}</td>
                          <td>{item.exp}</td>
                          <td><span className={`badge ${item.days < 30 ? 'br' : item.days < 90 ? 'by' : 'bg'}`}>{item.days}d</span></td>
                          <td><span className={badgeClass(item.status)}>{item.status}</span></td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs btn-p" type="button" onClick={() => {
                                setCredentialing(prev => prev.map((value, idx) => idx === index ? { ...value, days: 365, status: 'Active' } : value));
                                toast('Renewal initiated', 'ts');
                              }}>
                                Renew
                              </button>
                              <button className="btn btn-xs" type="button" onClick={() => toast('Editing credentialing record', 'ti')}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => setCredentialing(prev => prev.filter((_, idx) => idx !== index))}>
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'patients':
        return (
          <div className="page act" id="pg-patients">
            <div className="ph">
              <div>
                <h1>Patient Registry</h1>
                <p>Demographics, insurance & AR balance</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => openModal('m-patient')}>
                  + New Patient
                </button>
              </div>
            </div>
            <div className="content">
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <div className="srch" style={{ flex: 1, minWidth: 180 }}>
                  <span>🔍</span>
                  <input
                    placeholder="Search patients..."
                    value={formData['patientSearch'] || ''}
                    onChange={e => setFormData(prev => ({ ...prev, patientSearch: e.target.value }))}
                  />
                </div>
                <select className="btn" value={formData['patientPayerFilter'] || ''} onChange={e => setFormData(prev => ({ ...prev, patientPayerFilter: e.target.value }))}>
                  <option value="">All Payers</option>
                  <option>Delta Care</option>
                  <option>Aetna</option>
                  <option>Medicare</option>
                  <option>Self-Pay</option>
                </select>
              </div>
              <div className="card">
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>MRN</th>
                        <th>Name</th>
                        <th>DOB</th>
                        <th>Phone</th>
                        <th>Insurance</th>
                        <th>Member ID</th>
                        <th>Balance</th>
                        <th>Last Visit</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientFilter.map((patient, index) => (
                        <tr key={patient.id}>
                          <td className="mono" style={{ color: 'var(--ac)' }}>{patient.id}</td>
                          <td style={{ fontWeight: 500 }}>{patient.fn} {patient.ln}</td>
                          <td>{patient.dob}</td>
                          <td style={{ color: 'var(--tx2)' }}>{patient.ph}</td>
                          <td>{patient.ins}</td>
                          <td className="mono">{patient.mid}</td>
                          <td style={{ color: patient.bal > 0 ? 'var(--red)' : 'var(--grn)' }}>{fmt(patient.bal)}</td>
                          <td style={{ color: 'var(--tx2)' }}>{patient.lv}</td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs" type="button" onClick={() => editPatient(index)}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => deletePatient(index)}>
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'providers':
        return (
          <div className="page act" id="pg-providers">
            <div className="ph">
              <div>
                <h1>Providers</h1>
                <p>Staff, NPI, specialties & performance</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => openModal('m-prov')}>
                  + Add Provider
                </button>
              </div>
            </div>
            <div className="content">
              <div className="card">
                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Specialty</th>
                        <th>NPI</th>
                        <th>DEA</th>
                        <th>Monthly RVU</th>
                        <th>Collections</th>
                        <th>Credentialed</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map((provider, index) => (
                        <tr key={`${provider.name}-${index}`}>
                          <td style={{ fontWeight: 600 }}>{provider.name}</td>
                          <td>{provider.spec}</td>
                          <td className="mono">{provider.npi}</td>
                          <td className="mono">{provider.dea}</td>
                          <td>{provider.rvu}</td>
                          <td style={{ color: 'var(--grn)' }}>{fmt(provider.col)}</td>
                          <td>{provider.cred} payers</td>
                          <td><span className={badgeClass(provider.status)}>{provider.status}</span></td>
                          <td>
                            <div className="ac-cell">
                              <button className="btn btn-xs" type="button" onClick={() => toast('Editing provider', 'ti')}>
                                Edit
                              </button>
                              <button className="btn btn-xs btn-d" type="button" onClick={() => setProviders(prev => prev.filter((_, idx) => idx !== index))}>
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="page act" id="pg-reports">
            <div className="ph">
              <div>
                <h1>Reports & Analytics</h1>
                <p>Generate, export & schedule reports</p>
              </div>
              <div className="pa">
                <button className="btn btn-p" type="button" onClick={() => toast('Exported to PDF', 'ts')}>
                  ⬇ Export PDF
                </button>
              </div>
            </div>
            <div className="content">
              <div className="g3" style={{ marginBottom: 14 }}>
                {[
                  { emoji: '💰', title: 'Financial Summary', subtitle: 'P&L, collections, write-offs' },
                  { emoji: '📋', title: 'Claims Report', subtitle: 'Submitted, paid, denied' },
                  { emoji: '⏳', title: 'AR Aging', subtitle: 'By payer and bucket' },
                  { emoji: '🚫', title: 'Denial Analysis', subtitle: 'Root cause & trends' },
                  { emoji: '👨‍⚕️', title: 'Provider Performance', subtitle: 'RVU, efficiency' },
                  { emoji: '🛡', title: 'Payer Mix', subtitle: 'Patient distribution' },
                ].map(item => (
                  <div key={item.title} className="card" style={{ margin: 0, cursor: 'pointer' }} onClick={() => toast(`Generating ${item.title}…`, 'ti')}>
                    <div className="cb" style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{item.emoji}</div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--tx2)' }}>{item.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="ch"><span className="ct">6-Month Revenue Trend</span></div>
                <div className="cb">
                  <canvas ref={trendChartRef} height={160} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="page act" id="pg-settings">
            <div className="ph">
              <div>
                <h1>Practice Settings</h1>
                <p>Configure practice, integrations & team</p>
              </div>
            </div>
            <div className="content">
              <div className="tabs">
                {['Practice Info', 'Integrations', 'Billing Codes', 'Fee Schedule'].map(tab => (
                  <button key={tab} className={`tab ${settingsTab === tab ? 'act' : ''}`} type="button" onClick={() => setSettingsTab(tab)}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="card">
                <div className="ch">
                  <span className="ct">Practice Information</span>
                  <button className="btn btn-p btn-sm" type="button" onClick={() => toast('Settings saved', 'ts')}>
                    Save Changes
                  </button>
                </div>
                <div className="cb">
                  <div className="fg">
                    <div className="fi"><label>Practice Name</label><input value={formData['set-name'] || 'Smile Factory (DBS)'} onChange={e => setFormData(prev => ({ ...prev, 'set-name': e.target.value }))} /></div>
                    <div className="fi"><label>Practice Type</label><select value={formData['set-type'] || 'Dental'} onChange={e => setFormData(prev => ({ ...prev, 'set-type': e.target.value }))}><option>Dental</option><option>Medical</option><option>DME</option><option>Lab</option><option>Pharmacy</option></select></div>
                    <div className="fi"><label>NPI (Group)</label><input value={formData['set-npi'] || '1234567890'} onChange={e => setFormData(prev => ({ ...prev, 'set-npi': e.target.value }))} /></div>
                    <div className="fi"><label>Tax ID / EIN</label><input type="password" value={formData['set-tax'] || 'XX-XXXXXXX'} onChange={e => setFormData(prev => ({ ...prev, 'set-tax': e.target.value }))} /></div>
                    <div className="fi"><label>Phone</label><input value={formData['set-phone'] || '(555) 123-4567'} onChange={e => setFormData(prev => ({ ...prev, 'set-phone': e.target.value }))} /></div>
                    <div className="fi"><label>Fax</label><input value={formData['set-fax'] || '(555) 123-4568'} onChange={e => setFormData(prev => ({ ...prev, 'set-fax': e.target.value }))} /></div>
                    <div className="fi full"><label>Address</label><input value={formData['set-address'] || '123 Dental Way, Suite 100, City, ST 00000'} onChange={e => setFormData(prev => ({ ...prev, 'set-address': e.target.value }))} /></div>
                    <div className="fi"><label>POS Code</label><input value={formData['set-pos'] || '11 — Office'} onChange={e => setFormData(prev => ({ ...prev, 'set-pos': e.target.value }))} /></div>
                    <div className="fi"><label>Taxonomy Code</label><input value={formData['set-taxonomy'] || '1223G0001X'} onChange={e => setFormData(prev => ({ ...prev, 'set-taxonomy': e.target.value }))} /></div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="ch"><span className="ct">EMR / Clearinghouse Integrations</span></div>
                <div className="cb">
                  <div className="g3">
                    {[
                      { label: 'Availity', status: 'Connected', bordered: true, accent: 'bg', icon: '🔗' },
                      { label: 'Dentrix EMR', status: 'Connected', bordered: true, accent: 'bg', icon: '🏥' },
                      { label: 'Change Healthcare', status: 'Connect', bordered: false, accent: 'by', icon: '📡' },
                    ].map(item => (
                      <div key={item.label} className="card" style={{ margin: 0, borderColor: item.bordered ? 'var(--grn)' : undefined }}>
                        <div className="cb" style={{ textAlign: 'center', padding: 14 }}>
                          <div style={{ fontSize: 22, marginBottom: 5 }}>{item.icon}</div>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{item.label}</div>
                          <span className={`badge ${item.accent}`} style={{ marginTop: 5, cursor: item.label === 'Change Healthcare' ? 'pointer' : 'default' }} onClick={() => item.label === 'Change Healthcare' && toast('Connecting…', 'ti')}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <Topbar
        practiceName={practiceName}
        currentTime={clockText}
        onQuickAdd={() => openModal('m-quick')}
        onClearinghouse={() => openModal('m-ch')}
        onProfile={() => openModal('m-profile')}
        onPracticeOpen={() => openModal('m-practice')}
      />
      <div className="layout">
        <Sidebar
          activePage={activePage}
          onPageChange={page => setActivePage(page as PageKey)}
          claimBadge={claims.filter(claim => claim.status === 'Denied').length}
          denialBadge={denials.length}
          paBadge={priorAuths.filter(pa => pa.status === 'Pending').length}
        />
        <div className="main">{renderPage()}</div>
      </div>

      {modal && (
        <div className={`mo open`} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="md" style={{ maxWidth: modal === 'm-practice' || modal === 'm-newprac' ? '380px' : undefined }}>
            <div className="mh">
              <span className="mt">
                {modal === 'm-claim' && 'New Claim'}
                {modal === 'm-patient' && (patientEditIndex !== null ? 'Edit Patient' : 'New Patient')}
                {modal === 'm-appt' && 'New Appointment'}
                {modal === 'm-pa' && 'Prior Auth Request'}
                {modal === 'm-vob' && 'Verify Benefits (VOB)'}
                {modal === 'm-appeal' && 'File Appeal'}
                {modal === 'm-wo' && 'New Write-off'}
                {modal === 'm-cred' && 'Credentialing Application'}
                {modal === 'm-pay' && 'Post Payment'}
                {modal === 'm-payer' && 'Add Payer Contract'}
                {modal === 'm-prov' && 'Add Provider'}
                {modal === 'm-practice' && 'Switch Practice'}
                {modal === 'm-newprac' && 'Setup New Practice'}
                {modal === 'm-quick' && 'Quick Add'}
                {modal === 'm-ch' && 'Clearinghouse Status'}
                {modal === 'm-era' && 'Post ERA / Batch Payment'}
                {modal === 'm-profile' && 'My Profile'}
              </span>
              <button className="mc" type="button" onClick={closeModal}>✕</button>
            </div>
            <div className="mb">
              {(modal === 'm-claim') && (
                <div className="fg">
                  <div className="fi"><label>Patient</label><select value={formData['cl-pt'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cl-pt': e.target.value }))}><option value="">Select...</option>{renderListOptions}</select></div>
                  <div className="fi"><label>Date of Service</label><input type="date" value={formData['cl-dos'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cl-dos': e.target.value }))} /></div>
                  <div className="fi"><label>Primary Payer</label><select value={formData['cl-pay'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cl-pay': e.target.value }))}><option value="">Select...</option>{renderPayerOptions}</select></div>
                  <div className="fi"><label>Member ID</label><input value={formData['cl-mid'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cl-mid': e.target.value }))} placeholder="INS123456" /></div>
                  <div className="fi"><label>Provider</label><select value={formData['cl-prov'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cl-prov': e.target.value }))}><option value="">Select...</option>{renderProviderOptions}</select></div>
                  <div className="fi"><label>POS</label><select value={formData['cl-pos'] || '11-Office'} onChange={e => setFormData(prev => ({ ...prev, 'cl-pos': e.target.value }))}><option>11-Office</option><option>21-Inpatient</option><option>22-Outpatient</option><option>12-Home</option></select></div>
                  <div className="fi"><label>CPT / Procedure Code</label><input value={formData['cl-cpt'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cl-cpt': e.target.value }))} placeholder="D0150, D1110, 99213…" /></div>
                  <div className="fi"><label>ICD-10 Diagnosis</label><input value={formData['cl-icd'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cl-icd': e.target.value }))} placeholder="K08.109" /></div>
                  <div className="fi"><label>Billed Amount ($)</label><input type="number" value={formData['cl-amt'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cl-amt': e.target.value }))} placeholder="0.00" /></div>
                  <div className="fi"><label>Units</label><input type="number" value={formData['cl-units'] || '1'} onChange={e => setFormData(prev => ({ ...prev, 'cl-units': e.target.value }))} /></div>
                  <div className="fi"><label>PA Required?</label><select value={formData['cl-pa'] || 'No'} onChange={e => setFormData(prev => ({ ...prev, 'cl-pa': e.target.value }))}><option>No</option><option>Yes — Obtained</option><option>Yes — Pending</option></select></div>
                  <div className="fi"><label>Claim Type</label><select value={formData['cl-type'] || 'Professional CMS-1500'} onChange={e => setFormData(prev => ({ ...prev, 'cl-type': e.target.value }))}><option>Professional CMS-1500</option><option>Institutional UB-04</option><option>Dental ADA-2019</option></select></div>
                  <div className="fi full"><label>Notes</label><textarea value={formData['cl-notes'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cl-notes': e.target.value }))} placeholder="Clinical notes, attachments needed…" /></div>
                </div>
              )}
              {modal === 'm-patient' && (
                <div className="fg">
                  <div className="fi"><label>First Name</label><input value={formData['pt-fn'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pt-fn': e.target.value }))} placeholder="First" /></div>
                  <div className="fi"><label>Last Name</label><input value={formData['pt-ln'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pt-ln': e.target.value }))} placeholder="Last" /></div>
                  <div className="fi"><label>Date of Birth</label><input type="date" value={formData['pt-dob'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pt-dob': e.target.value }))} /></div>
                  <div className="fi"><label>Phone</label><input value={formData['pt-ph'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pt-ph': e.target.value }))} placeholder="(555) 000-0000" /></div>
                  <div className="fi"><label>Insurance</label><select value={formData['pt-ins'] || 'Delta Care'} onChange={e => setFormData(prev => ({ ...prev, 'pt-ins': e.target.value }))}><option>Delta Care</option><option>Delta Dental</option><option>Aetna</option><option>Medicare</option><option>Medicaid</option><option>Self-Pay</option></select></div>
                  <div className="fi"><label>Member ID</label><input value={formData['pt-mid'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pt-mid': e.target.value }))} placeholder="INS123456" /></div>
                  <div className="fi full"><label>Responsible Party</label><input value={formData['pt-rp'] || 'Self'} onChange={e => setFormData(prev => ({ ...prev, 'pt-rp': e.target.value }))} placeholder="Self / Guardian" /></div>
                </div>
              )}
              {modal === 'm-appt' && (
                <div className="fg">
                  <div className="fi"><label>Patient</label><select value={formData['ap-pt'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'ap-pt': e.target.value }))}><option value="">Select...</option>{renderListOptions}</select></div>
                  <div className="fi"><label>Provider</label><select value={formData['ap-prov'] || 'Dr. Smith'} onChange={e => setFormData(prev => ({ ...prev, 'ap-prov': e.target.value }))}><option>Dr. Smith</option><option>Dr. Jones</option></select></div>
                  <div className="fi"><label>Date</label><input type="date" value={formData['ap-dos'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'ap-dos': e.target.value }))} /></div>
                  <div className="fi"><label>Time</label><input type="time" value={formData['ap-time'] || '09:00'} onChange={e => setFormData(prev => ({ ...prev, 'ap-time': e.target.value }))} /></div>
                  <div className="fi"><label>Visit Type</label><select value={formData['ap-type'] || 'New Patient'} onChange={e => setFormData(prev => ({ ...prev, 'ap-type': e.target.value }))}><option>New Patient</option><option>Follow-up</option><option>Preventive</option><option>Procedure</option><option>Urgent</option></select></div>
                  <div className="fi"><label>Insurance</label><select value={formData['ap-ins'] || 'Delta Care'} onChange={e => setFormData(prev => ({ ...prev, 'ap-ins': e.target.value }))}><option>Delta Care</option><option>Delta Dental</option><option>Aetna</option><option>Medicare</option><option>Self-Pay</option></select></div>
                  <div className="fi"><label>VOB Status</label><select value={formData['ap-vob'] || '✅ Verified'} onChange={e => setFormData(prev => ({ ...prev, 'ap-vob': e.target.value }))}><option>✅ Verified</option><option>⚠️ Pending</option><option>❌ Not Verified</option><option>N/A Self-Pay</option></select></div>
                  <div className="fi full"><label>Chief Complaint</label><textarea value={formData['ap-cc'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'ap-cc': e.target.value }))} placeholder="Reason for visit…" style={{ minHeight: 55 }} /></div>
                </div>
              )}
              {modal === 'm-pa' && (
                <div className="fg">
                  <div className="fi"><label>Patient</label><select value={formData['pa-pt'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pa-pt': e.target.value }))}><option value="">Select...</option>{renderListOptions}</select></div>
                  <div className="fi"><label>Payer</label><select value={formData['pa-pay'] || 'Delta Care'} onChange={e => setFormData(prev => ({ ...prev, 'pa-pay': e.target.value }))}><option>Delta Care</option><option>Aetna</option><option>Medicare</option><option>Medicaid</option></select></div>
                  <div className="fi"><label>Service / Procedure</label><input value={formData['pa-svc'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pa-svc': e.target.value }))} placeholder="D4341 - Perio Scaling" /></div>
                  <div className="fi"><label>Units Requested</label><input type="number" value={formData['pa-units'] || '4'} onChange={e => setFormData(prev => ({ ...prev, 'pa-units': e.target.value }))} /></div>
                  <div className="fi"><label>End Date</label><input type="date" value={formData['pa-end'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'pa-end': e.target.value }))} /></div>
                  <div className="fi"><label>Urgency</label><select value={formData['pa-urgency'] || 'Routine'} onChange={e => setFormData(prev => ({ ...prev, 'pa-urgency': e.target.value }))}><option>Routine</option><option>Urgent</option><option>Emergent</option></select></div>
                  <div className="fi full"><label>Clinical Justification</label><textarea value={formData['pa-just'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pa-just': e.target.value }))} placeholder="Medical necessity documentation…" /></div>
                </div>
              )}
              {modal === 'm-vob' && (
                <div className="fg">
                  <div className="fi"><label>Patient</label><select value={formData['vob-pt'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'vob-pt': e.target.value }))}><option value="">Select...</option>{renderListOptions}</select></div>
                  <div className="fi"><label>Payer</label><select value={formData['vob-pay'] || 'Delta Care'} onChange={e => setFormData(prev => ({ ...prev, 'vob-pay': e.target.value }))}><option>Delta Care</option><option>Aetna</option><option>Medicare</option><option>Medicaid</option></select></div>
                  <div className="fi"><label>Member ID</label><input value={formData['vob-mid'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'vob-mid': e.target.value }))} placeholder="INS123456" /></div>
                  <div className="fi"><label>Date of Service</label><input type="date" value={formData['vob-dos'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'vob-dos': e.target.value }))} /></div>
                  <div className="fi"><label>Deductible ($)</label><input type="number" value={formData['vob-ded'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'vob-ded': e.target.value }))} placeholder="0.00" /></div>
                  <div className="fi"><label>Deductible Met ($)</label><input type="number" value={formData['vob-dmet'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'vob-dmet': e.target.value }))} placeholder="0.00" /></div>
                  <div className="fi"><label>Copay ($)</label><input type="number" value={formData['vob-cop'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'vob-cop': e.target.value }))} placeholder="0.00" /></div>
                  <div className="fi"><label>Coinsurance (%)</label><input type="number" value={formData['vob-coins'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'vob-coins': e.target.value }))} placeholder="20" /></div>
                  <div className="fi"><label>Auth Required?</label><select value={formData['vob-auth'] || 'No'} onChange={e => setFormData(prev => ({ ...prev, 'vob-auth': e.target.value }))}><option>No</option><option>Yes</option></select></div>
                </div>
              )}
              {modal === 'm-appeal' && (
                <div className="fg">
                  <div className="fi"><label>Claim #</label><input value={formData['ap-cl'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'ap-cl': e.target.value }))} placeholder="CLM-001" /></div>
                  <div className="fi"><label>Denial Code</label><input value={formData['ap-code'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'ap-code': e.target.value }))} placeholder="CO-97" /></div>
                  <div className="fi"><label>Payer</label><select value={formData['ap-pay'] || 'Delta Care'} onChange={e => setFormData(prev => ({ ...prev, 'ap-pay': e.target.value }))}><option>Delta Care</option><option>Aetna</option><option>Medicare</option></select></div>
                  <div className="fi"><label>Appeal Type</label><select value={formData['ap-type'] || 'First Level'} onChange={e => setFormData(prev => ({ ...prev, 'ap-type': e.target.value }))}><option>First Level</option><option>Second Level</option><option>External Review</option></select></div>
                  <div className="fi"><label>Deadline</label><input type="date" value={formData['ap-deadline'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'ap-deadline': e.target.value }))} /></div>
                  <div className="fi full"><label>Appeal Letter / Justification</label><textarea value={formData['ap-justification'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'ap-justification': e.target.value }))} style={{ minHeight: 110 }} placeholder="Write appeal letter here…" /></div>
                </div>
              )}
              {modal === 'm-wo' && (
                <div className="fg">
                  <div className="fi"><label>Claim #</label><input value={formData['wo-cl'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'wo-cl': e.target.value }))} placeholder="CLM-001" /></div>
                  <div className="fi"><label>Patient</label><select value={formData['wo-pt'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'wo-pt': e.target.value }))}><option value="">Select...</option>{renderListOptions}</select></div>
                  <div className="fi"><label>Payer</label><select value={formData['wo-pay'] || 'Delta Care'} onChange={e => setFormData(prev => ({ ...prev, 'wo-pay': e.target.value }))}><option>Delta Care</option><option>Medicare</option><option>Self-Pay</option></select></div>
                  <div className="fi"><label>Amount ($)</label><input type="number" value={formData['wo-amt'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'wo-amt': e.target.value }))} placeholder="0.00" /></div>
                  <div className="fi"><label>Category</label><select value={formData['wo-cat'] || 'Contractual Adjustment'} onChange={e => setFormData(prev => ({ ...prev, 'wo-cat': e.target.value }))}><option>Contractual Adjustment</option><option>Charity Care</option><option>Bad Debt</option><option>Small Balance</option><option>Administrative</option></select></div>
                  <div className="fi"><label>Authorized By</label><input value={formData['wo-auth'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'wo-auth': e.target.value }))} placeholder="Admin" /></div>
                  <div className="fi"><label>Date</label><input type="date" value={formData['wo-date'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'wo-date': e.target.value }))} /></div>
                  <div className="fi full"><label>Reason</label><textarea value={formData['wo-reason'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'wo-reason': e.target.value }))} style={{ minHeight: 55 }} placeholder="Justification…" /></div>
                </div>
              )}
              {modal === 'm-cred' && (
                <div className="fg">
                  <div className="fi"><label>Provider</label><select value={formData['cr-prov'] || 'Dr. Smith'} onChange={e => setFormData(prev => ({ ...prev, 'cr-prov': e.target.value }))}><option>Dr. Smith</option><option>Dr. Jones</option></select></div>
                  <div className="fi"><label>Payer</label><select value={formData['cr-pay'] || 'Delta Care'} onChange={e => setFormData(prev => ({ ...prev, 'cr-pay': e.target.value }))}><option>Delta Care</option><option>Aetna</option><option>Medicare</option><option>Medicaid</option></select></div>
                  <div className="fi"><label>NPI</label><input value={formData['cr-npi'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'cr-npi': e.target.value }))} placeholder="1234567890" /></div>
                  <div className="fi"><label>Date Submitted</label><input type="date" value={formData['cr-sub'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'cr-sub': e.target.value }))} /></div>
                  <div className="fi"><label>Effective Date</label><input type="date" value={formData['cr-eff'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'cr-eff': e.target.value }))} /></div>
                  <div className="fi"><label>Expiration Date</label><input type="date" value={formData['cr-exp'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'cr-exp': e.target.value }))} /></div>
                </div>
              )}
              {modal === 'm-pay' && (
                <div className="fg">
                  <div className="fi"><label>Claim #</label><input value={formData['py-cl'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'py-cl': e.target.value }))} placeholder="CLM-001" /></div>
                  <div className="fi"><label>Payment Date</label><input type="date" value={formData['py-date'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'py-date': e.target.value }))} /></div>
                  <div className="fi"><label>Payer Type</label><select value={formData['py-type'] || 'Insurance'} onChange={e => setFormData(prev => ({ ...prev, 'py-type': e.target.value }))}><option>Insurance</option><option>Patient</option></select></div>
                  <div className="fi"><label>Payer</label><select value={formData['py-pay'] || 'Delta Care'} onChange={e => setFormData(prev => ({ ...prev, 'py-pay': e.target.value }))}><option>Delta Care</option><option>Aetna</option><option>Medicare</option><option>Patient</option></select></div>
                  <div className="fi"><label>Billed ($)</label><input type="number" value={formData['py-billed'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'py-billed': e.target.value }))} /></div>
                  <div className="fi"><label>Allowed ($)</label><input type="number" value={formData['py-allowed'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'py-allowed': e.target.value }))} /></div>
                  <div className="fi"><label>Contractual Adj ($)</label><input type="number" value={formData['py-adj'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'py-adj': e.target.value }))} /></div>
                  <div className="fi"><label>Paid ($)</label><input type="number" value={formData['py-paid'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'py-paid': e.target.value }))} /></div>
                  <div className="fi full"><label>Pt Responsibility ($)</label><input type="number" value={formData['py-pr'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'py-pr': e.target.value }))} /></div>
                </div>
              )}
              {modal === 'm-payer' && (
                <div className="fg">
                  <div className="fi"><label>Payer Name</label><input value={formData['pay-name'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pay-name': e.target.value }))} placeholder="Aetna HMO" /></div>
                  <div className="fi"><label>Type</label><select value={formData['pay-type'] || 'Commercial'} onChange={e => setFormData(prev => ({ ...prev, 'pay-type': e.target.value }))}><option>Commercial</option><option>Government</option><option>Self-Pay</option><option>Managed Care</option></select></div>
                  <div className="fi"><label>Payer ID</label><input value={formData['pay-id'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pay-id': e.target.value }))} placeholder="60054" /></div>
                  <div className="fi"><label>Avg Pay Rate (%)</label><input type="number" value={formData['pay-rate'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pay-rate': e.target.value }))} placeholder="75" /></div>
                  <div className="fi"><label>Contract Exp Date</label><input type="date" value={formData['pay-exp'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'pay-exp': e.target.value }))} /></div>
                  <div className="fi full"><label>Visits/Month</label><input type="number" value={formData['pay-visits'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pay-visits': e.target.value }))} placeholder="20" /></div>
                  <div className="fi"><label>Avg AR Days</label><input type="number" value={formData['pay-ar'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pay-ar': e.target.value }))} placeholder="28" /></div>
                </div>
              )}
              {modal === 'm-prov' && (
                <div className="fg">
                  <div className="fi"><label>Full Name</label><input value={formData['pv-name'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pv-name': e.target.value }))} placeholder="Dr. Jane Doe" /></div>
                  <div className="fi"><label>Specialty</label><input value={formData['pv-spec'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pv-spec': e.target.value }))} placeholder="General Dentistry" /></div>
                  <div className="fi"><label>NPI</label><input value={formData['pv-npi'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pv-npi': e.target.value }))} placeholder="1234567890" /></div>
                  <div className="fi"><label>DEA #</label><input value={formData['pv-dea'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pv-dea': e.target.value }))} placeholder="AD1234567" /></div>
                  <div className="fi"><label>Monthly RVU Target</label><input type="number" value={formData['pv-rvu'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'pv-rvu': e.target.value }))} placeholder="200" /></div>
                </div>
              )}
              {modal === 'm-practice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {practices.map(practice => (
                    <div key={practice.id} className="card" style={{ margin: 0, padding: 11, cursor: 'pointer' }} onClick={() => switchPractice(practice.name)}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{practice.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--tx2)' }}>{practice.type} · NPI: {practice.npi}</div>
                    </div>
                  ))}
                  <button className="btn btn-p" style={{ width: '100%' }} type="button" onClick={() => setModal('m-newprac')}>
                    + Setup New Practice
                  </button>
                </div>
              )}
              {modal === 'm-newprac' && (
                <div className="fg">
                  <div className="fi"><label>Practice Name</label><input value={formData['np-name'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'np-name': e.target.value }))} placeholder="My Practice" /></div>
                  <div className="fi"><label>Type</label><select value={formData['np-type'] || 'Dental'} onChange={e => setFormData(prev => ({ ...prev, 'np-type': e.target.value }))}><option>Dental</option><option>Medical</option><option>DME</option><option>Lab</option><option>Pharmacy</option></select></div>
                  <div className="fi"><label>NPI (Group)</label><input value={formData['np-npi'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'np-npi': e.target.value }))} placeholder="1234567890" /></div>
                  <div className="fi"><label>Tax ID</label><input value={formData['np-tax'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'np-tax': e.target.value }))} placeholder="XX-XXXXXXX" /></div>
                  <div className="fi"><label>Phone</label><input value={formData['np-phone'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'np-phone': e.target.value }))} placeholder="(555) 000-0000" /></div>
                  <div className="fi full"><label>Address</label><input value={formData['np-address'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'np-address': e.target.value }))} placeholder="123 Main St…" /></div>
                </div>
              )}
              {modal === 'm-quick' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { label: '📋 New Claim', action: 'm-claim' },
                    { label: '👥 New Patient', action: 'm-patient' },
                    { label: '📅 New Appointment', action: 'm-appt' },
                    { label: '🔐 Prior Auth', action: 'm-pa' },
                    { label: '🔍 VOB Check', action: 'm-vob' },
                    { label: '💵 Post Payment', action: 'm-pay' },
                    { label: '✏️ Write-off', action: 'm-wo' },
                  ].map(item => (
                    <button key={item.action} className="btn" type="button" style={{ justifyContent: 'flex-start', padding: 11 }} onClick={() => setModal(item.action)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              {modal === 'm-ch' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="al al-s">✅ Availity Connected — Last sync: 2 min ago</div>
                  <div className="card" style={{ margin: 0, padding: 11 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600, fontSize: 12 }}>Claims Submitted (today)</span><span style={{ color: 'var(--grn)', fontWeight: 700 }}>23</span></div></div>
                  <div className="card" style={{ margin: 0, padding: 11 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600, fontSize: 12 }}>Claims Acknowledged</span><span style={{ color: 'var(--ac)', fontWeight: 700 }}>20</span></div></div>
                  <div className="card" style={{ margin: 0, padding: 11 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600, fontSize: 12 }}>Claims Rejected (edit req.)</span><span style={{ color: 'var(--red)', fontWeight: 700 }}>3</span></div></div>
                  <div className="card" style={{ margin: 0, padding: 11 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600, fontSize: 12 }}>ERAs Received</span><span style={{ color: 'var(--yel)', fontWeight: 700 }}>8</span></div></div>
                </div>
              )}
              {modal === 'm-era' && (
                <div className="fg">
                  <div className="fi"><label>Payer</label><select value={formData['era-pay'] || 'Delta Care'} onChange={e => setFormData(prev => ({ ...prev, 'era-pay': e.target.value }))}><option>Delta Care</option><option>Aetna</option><option>Medicare</option></select></div>
                  <div className="fi"><label>ERA / Check Date</label><input type="date" value={formData['era-date'] || today()} onChange={e => setFormData(prev => ({ ...prev, 'era-date': e.target.value }))} /></div>
                  <div className="fi"><label>Check / EFT #</label><input value={formData['era-chk'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'era-chk': e.target.value }))} placeholder="CHK999888" /></div>
                  <div className="fi"><label>Total ERA Amount ($)</label><input type="number" value={formData['era-amt'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'era-amt': e.target.value }))} placeholder="0.00" /></div>
                  <div className="fi full"><label>Upload ERA File (835)</label><input type="file" accept=".txt,.835,.xml" /></div>
                </div>
              )}
              {modal === 'm-profile' && (
                <div className="fg">
                  <div className="fi"><label>Name</label><input value={formData['profile-name'] || 'Admin User'} onChange={e => setFormData(prev => ({ ...prev, 'profile-name': e.target.value }))} /></div>
                  <div className="fi"><label>Role</label><select value={formData['profile-role'] || 'Billing Admin'} onChange={e => setFormData(prev => ({ ...prev, 'profile-role': e.target.value }))}><option>Billing Admin</option><option>Provider</option><option>Front Desk</option><option>Read Only</option></select></div>
                  <div className="fi full"><label>Email</label><input type="email" value={formData['profile-email'] || 'admin@smilefactory.com'} onChange={e => setFormData(prev => ({ ...prev, 'profile-email': e.target.value }))} /></div>
                  <div className="fi"><label>New Password</label><input type="password" value={formData['profile-pw'] || ''} onChange={e => setFormData(prev => ({ ...prev, 'profile-pw': e.target.value }))} /></div>
                </div>
              )}
            </div>
            <div className="mf">
              <button className="btn" type="button" onClick={closeModal}>Cancel</button>
              {['m-claim', 'm-patient', 'm-appt', 'm-pay', 'm-wo', 'm-payer', 'm-vob', 'm-pa', 'm-cred', 'm-prov', 'm-newprac'].includes(modal) && (
                <button 
                  className="btn btn-p" 
                  type="button" 
                  disabled={modal === 'm-claim' && (patients.length === 0 || providers.length === 0 || payers.length === 0)}
                  onClick={() => {
                    if (modal === 'm-claim') addClaim();
                    if (modal === 'm-patient') savePatient();
                    if (modal === 'm-appt') addAppointment();
                    if (modal === 'm-pay') addPay();
                    if (modal === 'm-wo') addWriteoff();
                    if (modal === 'm-payer') addPayer();
                    if (modal === 'm-vob') addVOB();
                    if (modal === 'm-pa') addPA();
                    if (modal === 'm-cred') addCred();
                    if (modal === 'm-prov') addProvider();
                    if (modal === 'm-newprac') addPractice();
                  }}
                >
                  {modal === 'm-claim' && 'Submit Claim →'}
                  {modal === 'm-patient' && (patientEditIndex !== null ? 'Update Patient' : 'Save Patient')}
                  {modal === 'm-appt' && 'Schedule'}
                  {modal === 'm-pay' && 'Post Payment'}
                  {modal === 'm-wo' && 'Post Write-off'}
                  {modal === 'm-payer' && 'Save Payer'}
                  {modal === 'm-vob' && 'Save VOB'}
                  {modal === 'm-pa' && 'Submit PA →'}
                  {modal === 'm-cred' && 'Save Application'}
                  {modal === 'm-prov' && 'Save Provider'}
                  {modal === 'm-newprac' && 'Create & Go Live →'}
                </button>
              )}
              {modal === 'm-appeal' && (
                <button className="btn btn-p" type="button" onClick={() => { closeModal(); toast('Appeal submitted', 'ts'); }}>
                  Submit Appeal →
                </button>
              )}
              {modal === 'm-ch' && (
                <button className="btn btn-p" type="button" onClick={() => { closeModal(); toast('Sync initiated', 'ti'); }}>
                  Force Sync Now
                </button>
              )}
              {modal === 'm-era' && (
                <button className="btn btn-p" type="button" onClick={() => { closeModal(); toast('ERA posted successfully', 'ts'); }}>
                  Post ERA
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div id="tc">
        {toasts.map(item => (
          <div key={item.id} className={`toast ${item.type}`}>{item.message}</div>
        ))}
      </div>
    </div>
  );
}
