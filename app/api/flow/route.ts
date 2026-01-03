import { NextRequest, NextResponse } from 'next/server';
import { getStaticFlowData } from '@/lib/static-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const flowData = getStaticFlowData();

    return NextResponse.json({
      success: true,
      data: flowData,
    });
  } catch (error) {
    console.error('Error fetching financial flow:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch financial flow',
      },
      { status: 500 }
    );
  }
}
