'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { CURRENCY_FORMAT, NUMBER_FORMAT, PERCENT_FORMAT } from '@/lib/constants';
import { DataTable } from '@/components/ui/data-table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function OwnerDetailPage() {
  const params = useParams();
  const [owner, setOwner] = useState<any>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerDetails();
  }, [params.id]);

  const fetchOwnerDetails = async () => {
    setLoading(true);
    try {
      const ownersResponse = await fetch('/api/owners');
      const ownersResult = await ownersResponse.json();

      if (ownersResult.success) {
        const foundOwner = ownersResult.data.find(
          (o: any) => o.ownerId?.toString() === params.id
        );
        setOwner(foundOwner);
      }

      const txnResponse = await fetch('/api/transactions');
      const txnResult = await txnResponse.json();

      if (txnResult.success) {
        const ownerAllocations = txnResult.data.filter((t: any) =>
          t.owners?.some((o: any) => o.ownerId?.toString() === params.id)
        );
        setAllocations(ownerAllocations);
      }
    } catch (error) {
      console.error('Error fetching owner details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading owner details...</div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/owners">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Owner Not Found</h1>
        </div>
      </div>
    );
  }

  const monthlyData = allocations.reduce((acc: any[], txn: any) => {
    if (txn.txnDate) {
      const month = format(new Date(txn.txnDate), 'MMM yyyy');
      const existing = acc.find((item) => item.month === month);
      const ownerAlloc = txn.owners?.find((o: any) => o.ownerId?.toString() === params.id);
      const amount = ownerAlloc?.allocatedAmount || 0;

      if (existing) {
        existing.amount += amount;
      } else {
        acc.push({ month, amount });
      }
    }
    return acc;
  }, []);

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
      header: 'Total Amount',
      render: (item: any) => (
        <span className="font-medium">
          {CURRENCY_FORMAT.format(item.amount)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'allocation',
      header: 'Allocation',
      render: (item: any) => {
        const ownerAlloc = item.owners?.find((o: any) => o.ownerId?.toString() === params.id);
        return (
          <div className="text-right">
            <div className="font-medium">
              {CURRENCY_FORMAT.format(ownerAlloc?.allocatedAmount || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {ownerAlloc?.allocationPercentage?.toFixed(2)}%
            </div>
          </div>
        );
      },
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
        <Link href="/owners">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{owner.ownerName}</h1>
          <p className="text-muted-foreground">
            {owner.interestTypeCode} Interest Holder
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_FORMAT.format(owner.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {NUMBER_FORMAT.format(owner.allocationCount || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Allocation %</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {PERCENT_FORMAT.format((owner.avgAllocationPercentage || 0) / 100)}
            </div>
          </CardContent>
        </Card>
      </div>

      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => CURRENCY_FORMAT.format(value)}
                />
                <Bar dataKey="amount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Owner Name</div>
            <div className="font-medium">{owner.ownerName}</div>
          </div>

          {owner.interestTypeCode && (
            <div>
              <div className="text-sm text-muted-foreground">Interest Type</div>
              <Badge variant="outline">{owner.interestTypeCode}</Badge>
            </div>
          )}

          {owner.email && (
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{owner.email}</div>
            </div>
          )}

          {owner.ownerStatus && (
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge>{owner.ownerStatus}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allocated Transactions ({allocations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={allocations}
            columns={columns}
            emptyMessage="No allocations found for this owner"
          />
        </CardContent>
      </Card>
    </div>
  );
}
