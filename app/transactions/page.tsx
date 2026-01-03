'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Search, Filter, Download } from 'lucide-react';
import { CURRENCY_FORMAT, TRANSACTION_STATUSES, STATUS_COLORS } from '@/lib/constants';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    minAmount: '',
    maxAmount: '',
    search: '',
    page: 1,
    pageSize: 50,
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters.status, filters.page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      params.append('page', filters.page.toString());
      params.append('pageSize', filters.pageSize.toString());

      const response = await fetch(`/api/transactions?${params}`);
      const result = await response.json();

      if (result.success) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, page: 1 });
    fetchTransactions();
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Date', 'Amount', 'Description', 'Status'].join(','),
      ...transactions.map((t) =>
        [
          t.txnId,
          t.txnDate ? format(new Date(t.txnDate), 'yyyy-MM-dd') : '',
          t.amount,
          `"${t.description || ''}"`,
          t.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const columns = [
    {
      key: 'txnId',
      header: 'Transaction ID',
      render: (item: Transaction) => (
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
      render: (item: Transaction) =>
        item.txnDate ? format(new Date(item.txnDate), 'MMM dd, yyyy') : '-',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: Transaction) => (
        <span className="font-medium">
          {CURRENCY_FORMAT.format(item.amount)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'description',
      header: 'Description',
      render: (item: Transaction) => (
        <span className="max-w-xs truncate block">{item.description}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Transaction) => (
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
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between slide-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all financial transactions
          </p>
        </div>
        <Button onClick={handleExport} className="gradient-blue text-white hover:shadow-lg transition-all hover:scale-105">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="card-hover border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-9 border-muted-foreground/20 focus-visible:ring-purple-500"
              />
            </div>

            <Select
              value={filters.status || 'ALL'}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === 'ALL' ? '' : value, page: 1 })
              }
            >
              <SelectTrigger className="border-muted-foreground/20 focus:ring-purple-500">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {TRANSACTION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) =>
                setFilters({ ...filters, minAmount: e.target.value })
              }
              className="border-muted-foreground/20 focus-visible:ring-purple-500"
            />

            <Input
              type="number"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) =>
                setFilters({ ...filters, maxAmount: e.target.value })
              }
              className="border-muted-foreground/20 focus-visible:ring-purple-500"
            />
          </div>

          <div className="mt-4">
            <Button onClick={handleSearch} className="gradient-purple text-white hover:shadow-lg transition-all">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover border-0 shadow-lg">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="shimmer text-muted-foreground">Loading transactions...</div>
            </div>
          ) : (
            <DataTable
              data={transactions}
              columns={columns}
              pagination={{
                page: filters.page,
                pageSize: filters.pageSize,
                total: transactions.length,
                onPageChange: (page) => setFilters({ ...filters, page }),
              }}
              emptyMessage="No transactions found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
