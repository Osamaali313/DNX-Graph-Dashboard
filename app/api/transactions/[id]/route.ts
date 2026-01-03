import { NextRequest, NextResponse } from 'next/server';
import { getStaticTransactionById } from '@/lib/static-data';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const transaction = getStaticTransactionById(params.id);

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transaction',
      },
      { status: 500 }
    );
  }
}
