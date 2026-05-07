import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/providers - Get all providers
export async function GET(request: NextRequest) {
  try {
    const providers = await prisma.provider.findMany({
      include: {
        practice: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

// POST /api/providers - Create a new provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      specialty,
      npi,
      dea,
      monthlyRVU,
      collections,
      status,
      practiceId,
    } = body;

    if (!name || !npi || !practiceId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, npi, practiceId' },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.create({
      data: {
        name,
        specialty,
        npi,
        dea,
        monthlyRVU: monthlyRVU ? parseFloat(monthlyRVU) : null,
        collections: collections ? parseFloat(collections) : null,
        status: status || 'Active',
        practiceId,
      },
      include: {
        practice: true,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}