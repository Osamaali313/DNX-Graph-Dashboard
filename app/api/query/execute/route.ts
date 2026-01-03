import { NextRequest, NextResponse } from 'next/server';
import { executeReadQuery } from '@/lib/neo4j';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, parameters } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Security check: only allow READ queries
    const queryLower = query.trim().toLowerCase();
    if (
      queryLower.startsWith('create') ||
      queryLower.startsWith('merge') ||
      queryLower.startsWith('delete') ||
      queryLower.startsWith('set') ||
      queryLower.startsWith('remove') ||
      queryLower.includes('detach')
    ) {
      return NextResponse.json(
        { success: false, error: 'Only READ queries are allowed' },
        { status: 403 }
      );
    }

    const result = await executeReadQuery(query, parameters || {});

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Error executing query:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute query',
      },
      { status: 500 }
    );
  }
}
