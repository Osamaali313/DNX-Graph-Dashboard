import { NextResponse } from 'next/server';
import { getStaticOwners } from '@/lib/static-data';

export async function GET() {
  try {
    const owners = getStaticOwners();

    return NextResponse.json({
      success: true,
      data: owners,
    });
  } catch (error) {
    console.error('Error fetching owners:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch owners',
      },
      { status: 500 }
    );
  }
}
