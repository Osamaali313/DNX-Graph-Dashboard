'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Search, Users, DollarSign } from 'lucide-react';
import { CURRENCY_FORMAT, NUMBER_FORMAT, PERCENT_FORMAT } from '@/lib/constants';
import { OwnerAllocation } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

export default function OwnersPage() {
  const [owners, setOwners] = useState<OwnerAllocation[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<OwnerAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = owners.filter((owner) =>
        owner.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOwners(filtered);
    } else {
      setFilteredOwners(owners);
    }
  }, [searchTerm, owners]);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/owners');
      const result = await response.json();

      if (result.success) {
        setOwners(result.data);
        setFilteredOwners(result.data);
      }
    } catch (error) {
      console.error('Error fetching owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = owners.reduce((sum, owner) => sum + (owner.totalRevenue || 0), 0);
  const avgAllocation = owners.length > 0
    ? owners.reduce((sum, owner) => sum + (owner.avgAllocationPercentage || 0), 0) / owners.length
    : 0;

  const chartData = [...owners]
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    .slice(0, 8)
    .map((owner) => ({
      name: owner.ownerName || 'Unknown',
      value: owner.totalRevenue || 0,
    }));

  const columns = [
    {
      key: 'ownerName',
      header: 'Owner Name',
      render: (item: OwnerAllocation) => (
        <Link
          href={`/owners/${item.ownerId}`}
          className="font-medium text-primary hover:underline"
        >
          {item.ownerName}
        </Link>
      ),
    },
    {
      key: 'interestTypeCode',
      header: 'Interest Type',
      render: (item: OwnerAllocation) => (
        <Badge variant="outline">{item.interestTypeCode || 'N/A'}</Badge>
      ),
    },
    {
      key: 'allocationCount',
      header: 'Allocations',
      render: (item: OwnerAllocation) => (
        <span className="font-medium">
          {NUMBER_FORMAT.format(item.allocationCount || 0)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'avgAllocationPercentage',
      header: 'Avg %',
      render: (item: OwnerAllocation) => (
        <span className="font-medium">
          {PERCENT_FORMAT.format((item.avgAllocationPercentage || 0) / 100)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'totalRevenue',
      header: 'Total Revenue',
      render: (item: OwnerAllocation) => (
        <span className="font-bold text-green-600">
          {CURRENCY_FORMAT.format(item.totalRevenue || 0)}
        </span>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ownership</h1>
        <p className="text-muted-foreground">
          Owner allocations and revenue distribution analysis
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {NUMBER_FORMAT.format(owners.length)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_FORMAT.format(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Allocation</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {PERCENT_FORMAT.format(avgAllocation / 100)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Distribution (Top 8 Owners)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${PERCENT_FORMAT.format(percent)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
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
          <CardTitle>Search Owners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by owner name..."
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
              <div className="text-muted-foreground">Loading owners...</div>
            </div>
          ) : (
            <DataTable
              data={filteredOwners}
              columns={columns}
              emptyMessage="No owners found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
