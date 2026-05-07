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
      practiceId,
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

    if (!practiceId || !patientId || !providerId || !payerId || !claimNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: practiceId, patientId, providerId, payerId, claimNumber' },
        { status: 400 }
      );
    }

    // Look up the payer by name if payerId is a string (name)
    let payer;
    if (typeof payerId === 'string' && !payerId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      payer = await prisma.payer.findUnique({
        where: { name: payerId },
      });
      if (!payer) {
        return NextResponse.json(
          { error: 'Payer not found' },
          { status: 400 }
        );
      }
    } else {
      payer = await prisma.payer.findUnique({
        where: { id: payerId },
      });
      if (!payer) {
        return NextResponse.json(
          { error: 'Payer not found' },
          { status: 400 }
        );
      }
    }

    // Look up the provider by NPI if providerId is a string (NPI)
    let provider;
    if (typeof providerId === 'string' && providerId.match(/^\d{10}$/)) {
      provider = await prisma.provider.findUnique({
        where: { npi: providerId },
      });
      if (!provider) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 400 }
        );
      }
    } else {
      provider = await prisma.provider.findUnique({
        where: { id: providerId },
      });
      if (!provider) {
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 400 }
        );
      }
    }

    const billedAmountNum = parseFloat(billedAmount);
    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        practiceId,
        patientId,
        providerId: provider.id,
        payerId: payer.id,
        dateOfService: new Date(dateOfService),
        billedAmount: billedAmountNum,
        balance: billedAmountNum, // Initial balance equals billed amount
        age: 0, // Age in days since submission, starts at 0
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
        practice: true,
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