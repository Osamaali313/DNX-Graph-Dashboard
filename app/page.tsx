'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, FileText, Users } from 'lucide-react';
import { CURRENCY_FORMAT, NUMBER_FORMAT } from '@/lib/constants';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/graph/stats')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setStats(result.data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching stats:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="shimmer text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Failed to load dashboard data</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Transactions',
      value: NUMBER_FORMAT.format(stats.totalTransactions),
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      title: 'Total Amount',
      value: CURRENCY_FORMAT.format(stats.totalAmount),
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Active AFEs',
      value: NUMBER_FORMAT.format(stats.activeAFEs),
      icon: TrendingUp,
      color: 'text-purple-500',
    },
    {
      title: 'Total Owners',
      value: NUMBER_FORMAT.format(stats.totalOwners),
      icon: Users,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="slide-in">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Financial graph database overview and key metrics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const gradients = ['gradient-blue', 'gradient-green', 'gradient-purple', 'gradient-orange'];
          return (
            <Card key={stat.title} className="card-hover border-0 shadow-lg overflow-hidden" style={{ animationDelay: `${index * 100}ms` }}>
              <div className={`absolute inset-0 ${gradients[index]} opacity-5`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${gradients[index]} p-2 rounded-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-hover border-0 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 gradient-purple opacity-5"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              AFE Budget Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Budget</span>
                <span className="font-semibold text-lg">
                  {CURRENCY_FORMAT.format(stats.afeBudgetSummary?.totalBudget || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Spent</span>
                <span className="font-semibold text-lg">
                  {CURRENCY_FORMAT.format(stats.afeBudgetSummary?.totalSpent || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Remaining</span>
                <span className="font-bold text-xl text-green-600 dark:text-green-400">
                  {CURRENCY_FORMAT.format(stats.afeBudgetSummary?.remaining || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 gradient-blue opacity-5"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <span className="text-sm text-muted-foreground">Pending Transactions</span>
                <span className="font-semibold text-lg">
                  {NUMBER_FORMAT.format(stats.pendingTransactions || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <span className="text-sm text-muted-foreground">Active Decks</span>
                <span className="font-semibold text-lg">
                  {NUMBER_FORMAT.format(stats.totalDecks || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <span className="text-sm text-muted-foreground">Total Relationships</span>
                <span className="font-semibold text-lg">
                  {NUMBER_FORMAT.format(stats.totalRelationships || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
