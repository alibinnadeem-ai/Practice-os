import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/claims - Get all claims
export async function GET(request: NextRequest) {
  try {
    const claims = await prisma.claim.findMany({
      include: {
        patient: true,
        provider: true,
        payer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    );
  }
}

// POST /api/claims - Create a new claim
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      claimNumber,
      patientId,
      providerId,
      payerId,
      dateOfService,
      billedAmount,
      cptCode,
      icdCode,
      units,
      posCode,
      priorAuthRequired,
      priorAuthObtained,
    } = body;

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        patientId,
        providerId,
        payerId,
        dateOfService: new Date(dateOfService),
        billedAmount: parseFloat(billedAmount),
        balance: parseFloat(billedAmount), // Initial balance equals billed amount
        cptCode,
        icdCode,
        units: parseInt(units) || 1,
        posCode,
        priorAuthRequired: priorAuthRequired || false,
        priorAuthObtained: priorAuthObtained || false,
        status: 'Submitted',
      },
      include: {
        patient: true,
        provider: true,
        payer: true,
      },
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error('Error creating claim:', error);
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    );
  }
}