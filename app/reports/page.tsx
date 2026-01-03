'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { CURRENCY_FORMAT, NUMBER_FORMAT, PERCENT_FORMAT } from '@/lib/constants';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function ReportsPage() {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [afes, setAfes] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('summary');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, txnRes, afesRes, decksRes, ownersRes] = await Promise.all([
        fetch('/api/graph/stats'),
        fetch('/api/transactions'),
        fetch('/api/afes'),
        fetch('/api/decks'),
        fetch('/api/owners'),
      ]);

      const [statsData, txnData, afesData, decksData, ownersData] = await Promise.all([
        statsRes.json(),
        txnRes.json(),
        afesRes.json(),
        decksRes.json(),
        ownersRes.json(),
      ]);

      if (statsData.success) setDashboardStats(statsData.data);
      if (txnData.success) setTransactions(txnData.data);
      if (afesData.success) setAfes(afesData.data);
      if (decksData.success) setDecks(decksData.data);
      if (ownersData.success) setOwners(ownersData.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      generated: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      summary: {
        totalTransactions: dashboardStats?.totalTransactions || 0,
        totalAmount: dashboardStats?.totalAmount || 0,
        activeAFEs: dashboardStats?.activeAFEs || 0,
        totalOwners: dashboardStats?.totalOwners || 0,
      },
      afes: afes.map(afe => ({
        afeNumber: afe.afeNumber,
        budget: afe.totalBudget,
        spent: afe.totalSpent,
        remaining: (afe.totalBudget || 0) - (afe.totalSpent || 0),
      })),
      decks: decks.map(deck => ({
        deckCode: deck.deckCode,
        transactions: deck.transactionCount,
        totalSpent: deck.totalSpent,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const monthlyTransactions = transactions.reduce((acc: any[], txn: any) => {
    if (txn.txnDate) {
      const month = format(new Date(txn.txnDate), 'MMM yyyy');
      const existing = acc.find((item) => item.month === month);

      if (existing) {
        existing.count += 1;
        existing.amount += txn.amount || 0;
      } else {
        acc.push({ month, count: 1, amount: txn.amount || 0 });
      }
    }
    return acc;
  }, []);

  const topDecks = [...decks]
    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
    .slice(0, 10)
    .map((deck) => ({
      name: deck.deckCode,
      amount: deck.totalSpent || 0,
    }));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading report data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive financial analysis and reporting
          </p>
        </div>
        <Button onClick={handleExportReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="summary">Executive Summary</SelectItem>
            <SelectItem value="afe">AFE Analysis</SelectItem>
            <SelectItem value="deck">Deck Performance</SelectItem>
            <SelectItem value="owner">Owner Distributions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {NUMBER_FORMAT.format(dashboardStats?.totalTransactions || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {CURRENCY_FORMAT.format(dashboardStats?.totalAmount || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active AFEs</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {NUMBER_FORMAT.format(dashboardStats?.activeAFEs || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {NUMBER_FORMAT.format(dashboardStats?.totalOwners || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTransactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Count" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Transaction Value</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTransactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => CURRENCY_FORMAT.format(value)}
                />
                <Legend />
                <Bar dataKey="amount" fill="#10b981" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Cost Centers by Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topDecks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                formatter={(value: number) => CURRENCY_FORMAT.format(value)}
              />
              <Bar dataKey="amount" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Metrics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total AFE Budget</div>
              <div className="text-xl font-bold">
                {CURRENCY_FORMAT.format(afes.reduce((sum, afe) => sum + (afe.totalBudget || 0), 0))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total AFE Spent</div>
              <div className="text-xl font-bold">
                {CURRENCY_FORMAT.format(afes.reduce((sum, afe) => sum + (afe.totalSpent || 0), 0))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">AFE Utilization</div>
              <div className="text-xl font-bold">
                {PERCENT_FORMAT.format(
                  afes.reduce((sum, afe) => sum + (afe.totalBudget || 0), 0) > 0
                    ? afes.reduce((sum, afe) => sum + (afe.totalSpent || 0), 0) /
                      afes.reduce((sum, afe) => sum + (afe.totalBudget || 0), 0)
                    : 0
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Cost Centers</div>
              <div className="text-xl font-bold">{NUMBER_FORMAT.format(decks.length)}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Deck Spending</div>
              <div className="text-xl font-bold">
                {CURRENCY_FORMAT.format(decks.reduce((sum, deck) => sum + (deck.totalSpent || 0), 0))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Owner Revenue</div>
              <div className="text-xl font-bold">
                {CURRENCY_FORMAT.format(owners.reduce((sum, owner) => sum + (owner.totalRevenue || 0), 0))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
