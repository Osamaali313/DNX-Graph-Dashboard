'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download } from 'lucide-react';
import { CURRENCY_FORMAT, NUMBER_FORMAT, STATUS_COLORS } from '@/lib/constants';
import { format } from 'date-fns';

export default function TransactionDetailPage() {
  const params = useParams();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransaction();
  }, [params.id]);

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/transactions/${params.id}`);
      const result = await response.json();

      if (result.success) {
        setTransaction(result.data);
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading transaction details...</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Transaction Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Transaction {transaction.txnId}
            </h1>
            <p className="text-muted-foreground">
              {transaction.txnDate
                ? format(new Date(transaction.txnDate), 'MMMM dd, yyyy')
                : 'No date'}
            </p>
          </div>
        </div>
        <Badge
          style={{
            backgroundColor: STATUS_COLORS[transaction.status] || '#6b7280',
            color: 'white',
          }}
          className="text-sm"
        >
          {transaction.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-2xl font-bold">
                {CURRENCY_FORMAT.format(transaction.amount)}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Description</div>
              <div className="font-medium">{transaction.description || 'N/A'}</div>
            </div>

            {transaction.quantity && (
              <div>
                <div className="text-sm text-muted-foreground">Quantity</div>
                <div className="font-medium">
                  {NUMBER_FORMAT.format(transaction.quantity)}{' '}
                  {transaction.uomCode || ''}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-muted-foreground">Transaction Date</div>
              <div className="font-medium">
                {transaction.txnDate
                  ? format(new Date(transaction.txnDate), 'PPP')
                  : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related Entities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transaction.deck && (
              <div>
                <div className="text-sm text-muted-foreground">Cost Center</div>
                <Link
                  href={`/decks/${transaction.deck.deckId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {transaction.deck.deckCode} - {transaction.deck.description}
                </Link>
              </div>
            )}

            {transaction.afe && (
              <div>
                <div className="text-sm text-muted-foreground">AFE</div>
                <Link
                  href={`/afes/${transaction.afe.afeId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {transaction.afe.afeNumber}
                </Link>
              </div>
            )}

            {transaction.billingCategory && (
              <div>
                <div className="text-sm text-muted-foreground">Billing Category</div>
                <div className="font-medium">
                  {transaction.billingCategory.billCatCode} -{' '}
                  {transaction.billingCategory.description}
                </div>
              </div>
            )}

            {transaction.owners && transaction.owners.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Owner Allocations ({transaction.owners.length})
                </div>
                <div className="space-y-2">
                  {transaction.owners.map((owner: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <Link
                        href={`/owners/${owner.ownerId}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {owner.ownerName}
                      </Link>
                      <div className="text-sm">
                        {owner.allocationPercentage?.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
