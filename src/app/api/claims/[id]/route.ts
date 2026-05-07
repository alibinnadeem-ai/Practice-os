import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/claims/[id] - Delete a claim
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Claim ID is required' },
        { status: 400 }
      );
    }

    // Find the claim first to get the claim number
    const claim = await prisma.claim.findUnique({
      where: { id },
    });

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    // Delete the claim
    await prisma.claim.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Claim deleted successfully' });
  } catch (error) {
    console.error('Error deleting claim:', error);
    return NextResponse.json(
      { error: 'Failed to delete claim' },
      { status: 500 }
    );
  }
}