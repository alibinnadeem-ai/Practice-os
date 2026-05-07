import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/payers - Get all payers
export async function GET(request: NextRequest) {
  try {
    const payers = await prisma.payer.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(payers);
  } catch (error) {
    console.error('Error fetching payers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payers' },
      { status: 500 }
    );
  }
}

// POST /api/payers - Create a new payer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      payerId,
      avgPayRate,
      visitsPerMonth,
      arDays,
      contractExp,
      status,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    const payer = await prisma.payer.create({
      data: {
        name,
        type,
        payerId,
        avgPayRate: avgPayRate ? parseFloat(avgPayRate) : null,
        visitsPerMonth: visitsPerMonth ? parseInt(visitsPerMonth) : null,
        arDays: arDays ? parseInt(arDays) : null,
        contractExp: contractExp && contractExp !== 'N/A' ? new Date(contractExp) : null,
        status: status || 'Active',
      },
    });

    return NextResponse.json(payer, { status: 201 });
  } catch (error) {
    console.error('Error creating payer:', error);
    return NextResponse.json(
      { error: 'Failed to create payer' },
      { status: 500 }
    );
  }
}