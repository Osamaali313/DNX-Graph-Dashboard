import { NextRequest, NextResponse } from 'next/server';
import { getStaticTransactions } from '@/lib/static-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      status: searchParams.get('status') || undefined,
      minAmount: searchParams.get('minAmount')
        ? parseFloat(searchParams.get('minAmount')!)
        : undefined,
      maxAmount: searchParams.get('maxAmount')
        ? parseFloat(searchParams.get('maxAmount')!)
        : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize')
        ? parseInt(searchParams.get('pageSize')!)
        : 50,
    };

    const transactions = getStaticTransactions(filters);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: transactions.length, // In production, get actual count
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
      },
      { status: 500 }
    );
  }
}
