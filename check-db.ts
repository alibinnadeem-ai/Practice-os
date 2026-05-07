import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function checkData() {
  try {
    const claimsCount = await prisma.claim.count();
    const patientsCount = await prisma.patient.count();
    const providersCount = await prisma.provider.count();
    const payersCount = await prisma.payer.count();

    console.log('Database check:');
    console.log('Claims:', claimsCount);
    console.log('Patients:', patientsCount);
    console.log('Providers:', providersCount);
    console.log('Payers:', payersCount);
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();