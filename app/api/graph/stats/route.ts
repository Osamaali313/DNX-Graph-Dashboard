import { NextResponse } from 'next/server';
import { getStaticDashboardStats } from '@/lib/static-data';

export async function GET() {
  try {
    const stats = getStaticDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
      },
      { status: 500 }
    );
  }
}
