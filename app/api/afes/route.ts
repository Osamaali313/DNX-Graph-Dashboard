import { NextResponse } from 'next/server';
import { getStaticAFEs } from '@/lib/static-data';

export async function GET() {
  try {
    const afes = getStaticAFEs();

    return NextResponse.json({
      success: true,
      data: afes,
    });
  } catch (error) {
    console.error('Error fetching AFEs:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch AFEs',
      },
      { status: 500 }
    );
  }
}
