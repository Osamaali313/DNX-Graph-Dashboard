'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { CURRENCY_FORMAT, NUMBER_FORMAT } from '@/lib/constants';
import { DataTable } from '@/components/ui/data-table';
import { format } from 'date-fns';

export default function DeckDetailPage() {
  const params = useParams();
  const [deck, setDeck] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeckDetails();
  }, [params.id]);

  const fetchDeckDetails = async () => {
    setLoading(true);
    try {
      // Fetch deck details and its transactions
      const deckResponse = await fetch('/api/decks');
      const deckResult = await deckResponse.json();

      if (deckResult.success) {
        const foundDeck = deckResult.data.find(
          (d: any) => d.deckId?.toString() === params.id
        );
        setDeck(foundDeck);
      }

      // Fetch transactions for this deck
      const txnResponse = await fetch('/api/transactions');
      const txnResult = await txnResponse.json();

      if (txnResult.success) {
        // Filter transactions by deck (in production, this would be done server-side)
        const deckTransactions = txnResult.data.filter(
          (t: any) => t.deckId?.toString() === params.id
        );
        setTransactions(deckTransactions);
      }
    } catch (error) {
      console.error('Error fetching deck details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading deck details...</div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/decks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Deck Not Found</h1>
        </div>
      </div>
    );
  }

  const columns = [
    {
      key: 'txnId',
      header: 'Transaction ID',
      render: (item: any) => (
        <Link
          href={`/transactions/${item.txnId}`}
          className="font-medium text-primary hover:underline"
        >
          {item.txnId}
        </Link>
      ),
    },
    {
      key: 'txnDate',
      header: 'Date',
      render: (item: any) =>
        item.txnDate ? format(new Date(item.txnDate), 'MMM dd, yyyy') : '-',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: any) => (
        <span className="font-medium">
          {CURRENCY_FORMAT.format(item.amount)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'description',
      header: 'Description',
      render: (item: any) => (
        <span className="max-w-xs truncate block">{item.description}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/decks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{deck.deckCode}</h1>
          <p className="text-muted-foreground">{deck.description}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Deck Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-sm">
              {deck.deckType || 'N/A'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {NUMBER_FORMAT.format(deck.transactionCount || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_FORMAT.format(deck.totalSpent || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={transactions}
            columns={columns}
            emptyMessage="No transactions found for this deck"
          />
        </CardContent>
      </Card>
    </div>
  );
}
