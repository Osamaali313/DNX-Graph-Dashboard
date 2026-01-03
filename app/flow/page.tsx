'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw } from 'lucide-react';
import { CURRENCY_FORMAT, NODE_COLORS } from '@/lib/constants';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

export default function FlowPage() {
  const [flowData, setFlowData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchFlowData();
  }, []);

  const fetchFlowData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/flow?${params}`);
      const result = await response.json();

      if (result.success) {
        setFlowData(result.data);
      }
    } catch (error) {
      console.error('Error fetching flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchFlowData();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading financial flow data...</div>
      </div>
    );
  }

  const transactions = flowData?.transactions || [];

  // Create flow nodes and links for visualization
  const createFlowVisualization = () => {
    const flows: any = {
      deckFlows: new Map(),
      afeFlows: new Map(),
      categoryFlows: new Map(),
    };

    transactions.forEach((txn: any) => {
      const amount = txn.amount || 0;

      // Deck flows
      if (txn.deckCode) {
        const key = txn.deckCode;
        flows.deckFlows.set(key, (flows.deckFlows.get(key) || 0) + amount);
      }

      // AFE flows
      if (txn.afeNumber) {
        const key = txn.afeNumber;
        flows.afeFlows.set(key, (flows.afeFlows.get(key) || 0) + amount);
      }

      // Category flows
      if (txn.billingCategory) {
        const key = txn.billingCategory;
        flows.categoryFlows.set(key, (flows.categoryFlows.get(key) || 0) + amount);
      }
    });

    return flows;
  };

  const flows = createFlowVisualization();

  const topDecks = Array.from(flows.deckFlows.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topAfes = Array.from(flows.afeFlows.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topCategories = Array.from(flows.categoryFlows.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Flow</h1>
        <p className="text-muted-foreground">
          Visual analysis of money flow through the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                From Date
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                To Date
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleRefresh} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS.Deck }}
              />
              Top Cost Centers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDecks.map(([deck, amount], index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {deck}
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {CURRENCY_FORMAT.format(amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS.AFE }}
              />
              Top AFEs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAfes.map(([afe, amount], index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {afe}
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {CURRENCY_FORMAT.format(amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS.BillingCategory }}
              />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map(([category, amount], index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {category}
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {CURRENCY_FORMAT.format(amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flow Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/10 p-8">
              <div className="flex items-center justify-between gap-8">
                <div className="flex-1 text-center">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">
                    Source
                  </div>
                  <div className="rounded-lg bg-background p-4 shadow-sm">
                    <div className="text-lg font-bold">Transactions</div>
                    <div className="text-sm text-muted-foreground">
                      {transactions.length} items
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-12 bg-border" />
                  <div>→</div>
                  <div className="h-0.5 w-12 bg-border" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="rounded-lg bg-background p-3 shadow-sm">
                    <div
                      className="mb-1 flex items-center gap-2 text-sm font-medium"
                      style={{ color: NODE_COLORS.Deck }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: NODE_COLORS.Deck }}
                      />
                      Cost Centers ({flows.deckFlows.size})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {CURRENCY_FORMAT.format(
                        Array.from(flows.deckFlows.values()).reduce((a, b) => a + b, 0)
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-background p-3 shadow-sm">
                    <div
                      className="mb-1 flex items-center gap-2 text-sm font-medium"
                      style={{ color: NODE_COLORS.AFE }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: NODE_COLORS.AFE }}
                      />
                      AFEs ({flows.afeFlows.size})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {CURRENCY_FORMAT.format(
                        Array.from(flows.afeFlows.values()).reduce((a, b) => a + b, 0)
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-background p-3 shadow-sm">
                    <div
                      className="mb-1 flex items-center gap-2 text-sm font-medium"
                      style={{ color: NODE_COLORS.BillingCategory }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: NODE_COLORS.BillingCategory }}
                      />
                      Categories ({flows.categoryFlows.size})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {CURRENCY_FORMAT.format(
                        Array.from(flows.categoryFlows.values()).reduce((a, b) => a + b, 0)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Total Transactions</Badge>
                <span className="font-medium">{transactions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Total Value</Badge>
                <span className="font-medium">
                  {CURRENCY_FORMAT.format(
                    transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Unique Cost Centers</Badge>
                <span className="font-medium">{flows.deckFlows.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Unique AFEs</Badge>
                <span className="font-medium">{flows.afeFlows.size}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
