'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { CURRENCY_FORMAT, NUMBER_FORMAT, PERCENT_FORMAT, STATUS_COLORS } from '@/lib/constants';
import { DataTable } from '@/components/ui/data-table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { format } from 'date-fns';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AFEDetailPage() {
  const params = useParams();
  const [afe, setAfe] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAfeDetails();
  }, [params.id]);

  const fetchAfeDetails = async () => {
    setLoading(true);
    try {
      const afeResponse = await fetch(`/api/afes/${params.id}`);
      const afeResult = await afeResponse.json();

      if (afeResult.success) {
        setAfe(afeResult.data);
      }

      const txnResponse = await fetch('/api/transactions');
      const txnResult = await txnResponse.json();

      if (txnResult.success) {
        const afeTransactions = txnResult.data.filter(
          (t: any) => t.afeId?.toString() === params.id
        );
        setTransactions(afeTransactions);
      }
    } catch (error) {
      console.error('Error fetching AFE details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading AFE details...</div>
      </div>
    );
  }

  if (!afe) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/afes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">AFE Not Found</h1>
        </div>
      </div>
    );
  }

  const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const remaining = (afe.totalBudget || 0) - totalSpent;
  const utilization = afe.totalBudget ? totalSpent / afe.totalBudget : 0;

  const pieData = [
    { name: 'Spent', value: totalSpent },
    { name: 'Remaining', value: Math.max(remaining, 0) },
  ];

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
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <Badge
          style={{
            backgroundColor: STATUS_COLORS[item.status] || '#6b7280',
            color: 'white',
          }}
        >
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/afes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {afe.afeNumber}
            </h1>
            <p className="text-muted-foreground">{afe.description}</p>
          </div>
        </div>
        <Badge
          style={{
            backgroundColor: STATUS_COLORS[afe.status] || '#6b7280',
            color: 'white',
          }}
          className="text-sm"
        >
          {afe.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_FORMAT.format(afe.totalBudget || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_FORMAT.format(totalSpent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {CURRENCY_FORMAT.format(remaining)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${utilization > 1 ? 'text-red-600' : ''}`}>
              {PERCENT_FORMAT.format(utilization)}
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${utilization > 1 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(utilization * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${PERCENT_FORMAT.format(percent)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => CURRENCY_FORMAT.format(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AFE Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">AFE Number</div>
              <div className="font-medium">{afe.afeNumber}</div>
            </div>

            {afe.description && (
              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="font-medium">{afe.description}</div>
              </div>
            )}

            {afe.projectCode && (
              <div>
                <div className="text-sm text-muted-foreground">Project Code</div>
                <div className="font-medium">{afe.projectCode}</div>
              </div>
            )}

            {afe.objectiveCode && (
              <div>
                <div className="text-sm text-muted-foreground">Objective</div>
                <div className="font-medium">{afe.objectiveCode}</div>
              </div>
            )}

            <div>
              <div className="text-sm text-muted-foreground">Transactions</div>
              <div className="font-medium">{NUMBER_FORMAT.format(transactions.length)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={transactions}
            columns={columns}
            emptyMessage="No transactions found for this AFE"
          />
        </CardContent>
      </Card>
    </div>
  );
}
