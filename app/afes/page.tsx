'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Search, TrendingUp, AlertCircle } from 'lucide-react';
import { CURRENCY_FORMAT, NUMBER_FORMAT, PERCENT_FORMAT, STATUS_COLORS } from '@/lib/constants';
import { AFEBudgetStatus } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AFEsPage() {
  const [afes, setAfes] = useState<AFEBudgetStatus[]>([]);
  const [filteredAfes, setFilteredAfes] = useState<AFEBudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAfes();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = afes.filter(
        (afe) =>
          afe.afeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          afe.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAfes(filtered);
    } else {
      setFilteredAfes(afes);
    }
  }, [searchTerm, afes]);

  const fetchAfes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/afes');
      const result = await response.json();

      if (result.success) {
        setAfes(result.data);
        setFilteredAfes(result.data);
      }
    } catch (error) {
      console.error('Error fetching AFEs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = afes.reduce((sum, afe) => sum + (afe.totalBudget || 0), 0);
  const totalSpent = afes.reduce((sum, afe) => sum + (afe.totalSpent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const activeAfes = afes.filter((afe) => afe.status === 'ACTIVE').length;

  const overBudgetAfes = afes.filter((afe) => (afe.totalSpent || 0) > (afe.totalBudget || 0));

  // Prepare chart data - top 10 AFEs by budget
  const chartData = [...afes]
    .sort((a, b) => (b.totalBudget || 0) - (a.totalBudget || 0))
    .slice(0, 10)
    .map((afe) => ({
      name: afe.afeNumber || 'Unknown',
      Budget: afe.totalBudget || 0,
      Spent: afe.totalSpent || 0,
      Remaining: (afe.totalBudget || 0) - (afe.totalSpent || 0),
    }));

  const columns = [
    {
      key: 'afeNumber',
      header: 'AFE Number',
      render: (item: AFEBudgetStatus) => (
        <Link
          href={`/afes/${item.afeId}`}
          className="font-medium text-primary hover:underline"
        >
          {item.afeNumber}
        </Link>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (item: AFEBudgetStatus) => (
        <span className="max-w-md truncate block">{item.description}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: AFEBudgetStatus) => (
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
    {
      key: 'totalBudget',
      header: 'Budget',
      render: (item: AFEBudgetStatus) => (
        <span className="font-medium">
          {CURRENCY_FORMAT.format(item.totalBudget || 0)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'totalSpent',
      header: 'Spent',
      render: (item: AFEBudgetStatus) => (
        <span className="font-medium">
          {CURRENCY_FORMAT.format(item.totalSpent || 0)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'remaining',
      header: 'Remaining',
      render: (item: AFEBudgetStatus) => {
        const remaining = (item.totalBudget || 0) - (item.totalSpent || 0);
        const isOverBudget = remaining < 0;
        return (
          <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
            {CURRENCY_FORMAT.format(remaining)}
          </span>
        );
      },
      className: 'text-right',
    },
    {
      key: 'utilization',
      header: 'Utilization',
      render: (item: AFEBudgetStatus) => {
        const percentage = item.totalBudget ? (item.totalSpent || 0) / item.totalBudget : 0;
        const isOverBudget = percentage > 1;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(percentage * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
              {PERCENT_FORMAT.format(percentage)}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AFE Tracker</h1>
        <p className="text-muted-foreground">
          Authorization for Expenditure budget tracking and analysis
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AFEs</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{NUMBER_FORMAT.format(afes.length)}</div>
            <p className="text-xs text-muted-foreground">
              {activeAfes} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_FORMAT.format(totalBudget)}
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
            <p className="text-xs text-muted-foreground">
              {PERCENT_FORMAT.format(totalBudget ? totalSpent / totalBudget : 0)} utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <AlertCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {CURRENCY_FORMAT.format(totalRemaining)}
            </div>
            {overBudgetAfes.length > 0 && (
              <p className="text-xs text-red-600">
                {overBudgetAfes.length} over budget
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 AFEs by Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => CURRENCY_FORMAT.format(value)}
              />
              <Legend />
              <Bar dataKey="Budget" fill="#3b82f6" />
              <Bar dataKey="Spent" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search AFEs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by AFE number or description..."
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
              <div className="text-muted-foreground">Loading AFEs...</div>
            </div>
          ) : (
            <DataTable
              data={filteredAfes}
              columns={columns}
              emptyMessage="No AFEs found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
