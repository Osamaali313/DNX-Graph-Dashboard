import { NextResponse } from 'next/server';
import { getStaticDecks } from '@/lib/static-data';

export async function GET() {
  try {
    const decks = getStaticDecks();

    return NextResponse.json({
      success: true,
      data: decks,
    });
  } catch (error) {
    console.error('Error fetching decks:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch decks',
      },
      { status: 500 }
    );
  }
}
