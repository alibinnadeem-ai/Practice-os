import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['query'],
});

async function main() {
  console.log('Seeding database...');

  // Create a practice
  const practice = await prisma.practice.create({
    data: {
      name: 'Smile Factory (DBS)',
      type: 'Dental',
      npi: '1234567890',
      taxId: 'XX-XXXXXXX',
      phone: '(555) 123-4567',
      fax: '(555) 123-4568',
      address: '123 Dental Way, Suite 100, City, ST 00000',
      posCode: '11',
      taxonomyCode: '1223G0001X',
    },
  });

  // Create providers
  const provider1 = await prisma.provider.create({
    data: {
      name: 'Dr. Sarah Smith',
      specialty: 'General Dentistry',
      npi: '1234567890',
      dea: 'AS1234567',
      monthlyRVU: 280,
      collections: 42500,
      status: 'Active',
      practiceId: practice.id,
    },
  });

  const provider2 = await prisma.provider.create({
    data: {
      name: 'Dr. Marcus Jones',
      specialty: 'Endodontics',
      npi: '0987654321',
      dea: 'AJ7654321',
      monthlyRVU: 195,
      collections: 31200,
      status: 'Active',
      practiceId: practice.id,
    },
  });

  // Create payers
  const payer1 = await prisma.payer.create({
    data: {
      name: 'Delta Care',
      type: 'Commercial',
      payerId: 'DC001',
      avgPayRate: 82,
      visitsPerMonth: 45,
      arDays: 18,
      contractExp: new Date('2026-01-01'),
      status: 'Active',
    },
  });

  const payer2 = await prisma.payer.create({
    data: {
      name: 'Delta Dental',
      type: 'Commercial',
      payerId: 'DD002',
      avgPayRate: 78,
      visitsPerMonth: 38,
      arDays: 22,
      contractExp: new Date('2026-06-01'),
      status: 'Active',
    },
  });

  const payer3 = await prisma.payer.create({
    data: {
      name: 'Aetna',
      type: 'Commercial',
      payerId: 'AE003',
      avgPayRate: 74,
      visitsPerMonth: 28,
      arDays: 28,
      contractExp: new Date('2025-12-01'),
      status: 'Active',
    },
  });

  const payer4 = await prisma.payer.create({
    data: {
      name: 'Medicare',
      type: 'Government',
      payerId: 'MC001',
      avgPayRate: 65,
      visitsPerMonth: 20,
      arDays: 35,
      status: 'Active',
    },
  });

  const payer5 = await prisma.payer.create({
    data: {
      name: 'Medicaid',
      type: 'Government',
      payerId: 'MED001',
      avgPayRate: 55,
      visitsPerMonth: 15,
      arDays: 42,
      status: 'Active',
    },
  });

  const payer6 = await prisma.payer.create({
    data: {
      name: 'Self-Pay',
      type: 'Self-Pay',
      avgPayRate: 40,
      visitsPerMonth: 14,
      arDays: 60,
      status: 'Active',
    },
  });

  // Create patients
  const patient1 = await prisma.patient.create({
    data: {
      mrn: 'P001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      dob: new Date('1985-03-12'),
      phone: '(555)201-1234',
      insurance: 'Delta Care',
      memberId: 'DC-101',
      balance: 205,
      lastVisit: new Date('2025-04-10'),
      practiceId: practice.id,
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      mrn: 'P002',
      firstName: 'Michael',
      lastName: 'Torres',
      dob: new Date('1972-07-28'),
      phone: '(555)202-5678',
      insurance: 'Aetna',
      memberId: 'AE-234',
      balance: 0,
      lastVisit: new Date('2025-04-15'),
      practiceId: practice.id,
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      mrn: 'P003',
      firstName: 'Linda',
      lastName: 'Patel',
      dob: new Date('1990-11-05'),
      phone: '(555)203-9012',
      insurance: 'Delta Dental',
      memberId: 'DD-567',
      balance: 75,
      lastVisit: new Date('2025-04-18'),
      practiceId: practice.id,
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      mrn: 'P004',
      firstName: 'James',
      lastName: 'Wilson',
      dob: new Date('1968-01-19'),
      phone: '(555)204-3456',
      insurance: 'Medicare',
      memberId: 'MC-890',
      balance: 340,
      lastVisit: new Date('2025-03-22'),
      practiceId: practice.id,
    },
  });

  const patient5 = await prisma.patient.create({
    data: {
      mrn: 'P005',
      firstName: 'Emily',
      lastName: 'Chen',
      dob: new Date('1995-09-30'),
      phone: '(555)205-7890',
      insurance: 'Delta Care',
      memberId: 'DC-445',
      balance: 58,
      lastVisit: new Date('2025-04-28'),
      practiceId: practice.id,
    },
  });

  const patient6 = await prisma.patient.create({
    data: {
      mrn: 'P006',
      firstName: 'Robert',
      lastName: 'Kim',
      dob: new Date('1980-06-14'),
      phone: '(555)206-2345',
      insurance: 'Self-Pay',
      memberId: '—',
      balance: 620,
      lastVisit: new Date('2025-04-05'),
      practiceId: practice.id,
    },
  });

  const patient7 = await prisma.patient.create({
    data: {
      mrn: 'P007',
      firstName: 'Maria',
      lastName: 'Garcia',
      dob: new Date('1962-12-22'),
      phone: '(555)207-6789',
      insurance: 'Medicaid',
      memberId: 'MED-321',
      balance: 0,
      lastVisit: new Date('2025-04-20'),
      practiceId: practice.id,
    },
  });

  // Create claims
  await prisma.claim.createMany({
    data: [
      {
        claimNumber: 'CLM-001',
        dateOfService: new Date('2025-04-10'),
        billedAmount: 450,
        balance: 170,
        status: 'Paid',
        age: 22,
        cptCode: 'D0120',
        patientId: patient1.id,
        providerId: provider1.id,
        payerId: payer1.id,
        practiceId: practice.id,
      },
      {
        claimNumber: 'CLM-002',
        dateOfService: new Date('2025-04-15'),
        billedAmount: 1200,
        balance: 1200,
        status: 'Denied',
        age: 17,
        cptCode: 'D2750',
        patientId: patient2.id,
        providerId: provider2.id,
        payerId: payer3.id,
        practiceId: practice.id,
      },
      {
        claimNumber: 'CLM-003',
        dateOfService: new Date('2025-04-18'),
        billedAmount: 320,
        balance: 75,
        status: 'Paid',
        age: 14,
        cptCode: 'D1110',
        patientId: patient3.id,
        providerId: provider1.id,
        payerId: payer2.id,
        practiceId: practice.id,
      },
      {
        claimNumber: 'CLM-004',
        dateOfService: new Date('2025-03-22'),
        billedAmount: 980,
        balance: 980,
        status: 'Pending',
        age: 40,
        cptCode: 'D7140',
        patientId: patient4.id,
        providerId: provider1.id,
        payerId: payer4.id,
        practiceId: practice.id,
      },
      {
        claimNumber: 'CLM-005',
        dateOfService: new Date('2025-04-28'),
        billedAmount: 180,
        balance: 58,
        status: 'Paid',
        age: 4,
        cptCode: 'D0210',
        patientId: patient5.id,
        providerId: provider2.id,
        payerId: payer1.id,
        practiceId: practice.id,
      },
      {
        claimNumber: 'CLM-006',
        dateOfService: new Date('2025-04-05'),
        billedAmount: 620,
        balance: 620,
        status: 'Pending',
        age: 27,
        cptCode: 'D7230',
        patientId: patient6.id,
        providerId: provider1.id,
        payerId: payer6.id,
        practiceId: practice.id,
      },
      {
        claimNumber: 'CLM-007',
        dateOfService: new Date('2025-04-20'),
        billedAmount: 275,
        balance: 275,
        status: 'Submitted',
        age: 12,
        cptCode: 'D0220',
        patientId: patient7.id,
        providerId: provider2.id,
        payerId: payer5.id,
        practiceId: practice.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });