'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Search, TrendingUp } from 'lucide-react';
import { CURRENCY_FORMAT, NUMBER_FORMAT } from '@/lib/constants';
import { DeckSpending } from '@/lib/types';

export default function DecksPage() {
  const [decks, setDecks] = useState<DeckSpending[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<DeckSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDecks();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = decks.filter(
        (deck) =>
          deck.deckCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deck.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDecks(filtered);
    } else {
      setFilteredDecks(decks);
    }
  }, [searchTerm, decks]);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/decks');
      const result = await response.json();

      if (result.success) {
        setDecks(result.data);
        setFilteredDecks(result.data);
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSpending = decks.reduce((sum, deck) => sum + (deck.totalSpent || 0), 0);
  const totalTransactions = decks.reduce(
    (sum, deck) => sum + (deck.transactionCount || 0),
    0
  );

  const columns = [
    {
      key: 'deckCode',
      header: 'Deck Code',
      render: (item: DeckSpending) => (
        <Link
          href={`/decks/${item.deckId}`}
          className="font-medium text-primary hover:underline"
        >
          {item.deckCode}
        </Link>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (item: DeckSpending) => (
        <span className="max-w-md truncate block">{item.description}</span>
      ),
    },
    {
      key: 'deckType',
      header: 'Type',
      render: (item: DeckSpending) => (
        <Badge variant="outline">{item.deckType || 'N/A'}</Badge>
      ),
    },
    {
      key: 'transactionCount',
      header: 'Transactions',
      render: (item: DeckSpending) => (
        <span className="font-medium">
          {NUMBER_FORMAT.format(item.transactionCount || 0)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      render: (item: DeckSpending) => (
        <span className="font-bold">
          {CURRENCY_FORMAT.format(item.totalSpent || 0)}
        </span>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cost Centers</h1>
        <p className="text-muted-foreground">
          View deck spending and transaction activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {NUMBER_FORMAT.format(decks.length)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {NUMBER_FORMAT.format(totalTransactions)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_FORMAT.format(totalSpending)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Decks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by deck code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">Loading decks...</div>
            </div>
          ) : (
            <DataTable
              data={filteredDecks}
              columns={columns}
              emptyMessage="No cost centers found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
