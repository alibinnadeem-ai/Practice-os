import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/patients - Get all patients
export async function GET(request: NextRequest) {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        practice: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST /api/patients - Create a new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mrn,
      firstName,
      lastName,
      dob,
      phone,
      insurance,
      memberId,
      practiceId,
    } = body;

    if (!mrn || !firstName || !lastName || !practiceId) {
      return NextResponse.json(
        { error: 'Missing required fields: mrn, firstName, lastName, practiceId' },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        mrn,
        firstName,
        lastName,
        dob: new Date(dob),
        phone,
        insurance,
        memberId,
        practiceId,
      },
      include: {
        practice: true,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}