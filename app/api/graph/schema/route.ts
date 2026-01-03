import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Define the graph schema metadata based on build_graph_db.py
    const schema = {
      nodeTypes: [
        {
          label: 'Transaction',
          description: 'Financial transactions representing costs and expenses',
          color: '#667eea',
          icon: 'receipt',
          properties: ['txn_id', 'amount', 'txn_date', 'status', 'description'],
          sampleCount: 200,
        },
        {
          label: 'AFE',
          description: 'Authorization for Expenditure - Budget authorizations',
          color: '#8b5cf6',
          icon: 'document',
          properties: ['afe_id', 'afe_number', 'status', 'total_budget', 'description'],
          sampleCount: 30,
        },
        {
          label: 'Deck',
          description: 'Cost centers and operational areas',
          color: '#3b82f6',
          icon: 'building',
          properties: ['deck_id', 'deck_code', 'deck_type', 'description'],
          sampleCount: 20,
        },
        {
          label: 'BillingCategory',
          description: 'Expense categorization and classification',
          color: '#10b981',
          icon: 'tag',
          properties: ['bill_cat_code', 'description', 'type', 'taxable'],
          sampleCount: 25,
        },
        {
          label: 'Owner',
          description: 'Title owners and stakeholders with revenue interest',
          color: '#f59e0b',
          icon: 'users',
          properties: ['owner_id', 'owner_name', 'owner_status', 'interest_type_code'],
          sampleCount: 15,
        },
        {
          label: 'Invoice',
          description: 'Vendor invoices for goods and services',
          color: '#ec4899',
          icon: 'file-text',
          properties: ['invoice_id', 'invoice_number', 'amount', 'status', 'vendor_name'],
          sampleCount: 50,
        },
        {
          label: 'Payment',
          description: 'Payment records for invoices',
          color: '#06b6d4',
          icon: 'credit-card',
          properties: ['payment_id', 'payment_number', 'amount', 'status', 'method'],
          sampleCount: 40,
        },
      ],
      relationshipTypes: [
        {
          type: 'CHARGED_TO',
          from: 'Transaction',
          to: 'Deck',
          description: 'Transactions are charged to cost centers/decks',
          cardinality: 'N:1',
          properties: ['amount', 'created_date'],
          sampleCount: 200,
        },
        {
          type: 'FUNDED_BY',
          from: 'Transaction',
          to: 'AFE',
          description: 'Transactions are funded by budget authorizations',
          cardinality: 'N:1',
          properties: ['amount', 'approved_date'],
          sampleCount: 200,
        },
        {
          type: 'CATEGORIZED_AS',
          from: 'Transaction',
          to: 'BillingCategory',
          description: 'Transactions are categorized for accounting',
          cardinality: 'N:1',
          properties: ['created_date'],
          sampleCount: 200,
        },
        {
          type: 'ALLOCATED_TO',
          from: 'Transaction',
          to: 'Owner',
          description: 'Transactions are allocated to owners with revenue interest',
          cardinality: 'N:M',
          properties: ['allocation_percentage', 'allocated_amount'],
          sampleCount: 150,
        },
        {
          type: 'CHARGED_TO',
          from: 'Invoice',
          to: 'Deck',
          description: 'Invoices are charged to cost centers/decks',
          cardinality: 'N:1',
          properties: ['amount'],
          sampleCount: 50,
        },
        {
          type: 'FUNDED_BY',
          from: 'Invoice',
          to: 'AFE',
          description: 'Invoices are funded by budget authorizations',
          cardinality: 'N:1',
          properties: ['amount'],
          sampleCount: 50,
        },
        {
          type: 'PAYS',
          from: 'Payment',
          to: 'Invoice',
          description: 'Payments pay for invoices',
          cardinality: 'N:1',
          properties: ['amount', 'payment_date'],
          sampleCount: 40,
        },
      ],
      hierarchy: {
        roots: ['AFE', 'Deck', 'Owner'],
        levels: {
          AFE: {
            children: ['Transaction', 'Invoice'],
            grandchildren: ['Owner', 'Payment'],
          },
          Deck: {
            children: ['Transaction', 'Invoice'],
            grandchildren: ['Owner', 'Payment'],
          },
          Owner: {
            parents: ['Transaction'],
            grandparents: ['AFE', 'Deck'],
          },
        },
      },
      metadata: {
        totalNodes: 380,
        totalRelationships: 690,
        databaseType: 'Neo4j',
        schemaVersion: '1.0',
        lastUpdated: '2025-12-18',
      },
    };

    return NextResponse.json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch schema metadata',
      },
      { status: 500 }
    );
  }
}
