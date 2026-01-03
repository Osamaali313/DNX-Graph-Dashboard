import { NextRequest, NextResponse } from 'next/server';
import { getStaticAFEById } from '@/lib/static-data';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const afe = getStaticAFEById(params.id);

    if (!afe) {
      return NextResponse.json(
        { success: false, error: 'AFE not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: afe,
    });
  } catch (error) {
    console.error('Error fetching AFE:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch AFE',
      },
      { status: 500 }
    );
  }
}
