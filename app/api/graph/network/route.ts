import { NextRequest, NextResponse } from 'next/server';
import { getStaticNetworkData } from '@/lib/static-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const depth = searchParams.get('depth') ? parseInt(searchParams.get('depth')!) : 2;

    // Level 0 - Return schema-level graph (node types only)
    if (depth === 0) {
      const schemaGraph = {
        nodes: [
          { id: 'Transaction', type: 'Transaction', label: 'Transaction (200)' },
          { id: 'AFE', type: 'AFE', label: 'AFE (30)' },
          { id: 'Deck', type: 'Deck', label: 'Deck (20)' },
          { id: 'BillingCategory', type: 'BillingCategory', label: 'BillingCategory (25)' },
          { id: 'Owner', type: 'Owner', label: 'Owner (15)' },
          { id: 'Invoice', type: 'Invoice', label: 'Invoice (50)' },
          { id: 'Payment', type: 'Payment', label: 'Payment (40)' },
        ],
        edges: [
          { source: 'Transaction', target: 'Deck', type: 'CHARGED_TO' },
          { source: 'Transaction', target: 'AFE', type: 'FUNDED_BY' },
          { source: 'Transaction', target: 'BillingCategory', type: 'CATEGORIZED_AS' },
          { source: 'Transaction', target: 'Owner', type: 'ALLOCATED_TO' },
          { source: 'Invoice', target: 'Deck', type: 'CHARGED_TO' },
          { source: 'Invoice', target: 'AFE', type: 'FUNDED_BY' },
          { source: 'Payment', target: 'Invoice', type: 'PAYS' },
        ],
      };

      return NextResponse.json({
        success: true,
        data: schemaGraph,
      });
    }

    // Use static data - instant response with level support (1, 2, 3)
    const networkData = getStaticNetworkData(depth);

    return NextResponse.json({
      success: true,
      data: networkData,
    });
  } catch (error) {
    console.error('Error fetching network data:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch network data',
      },
      { status: 500 }
    );
  }
}
