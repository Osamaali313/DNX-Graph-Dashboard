'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HierarchyTree, HierarchyNode } from '@/components/graph/hierarchy-tree';
import {
  getStaticAFEs,
  getStaticDecks,
  getStaticOwners,
  getStaticTransactions
} from '@/lib/static-data';
import { Search, GitBranch, ArrowRight } from 'lucide-react';

type RootType = 'AFE' | 'Deck' | 'Owner';

export default function RelationshipsPage() {
  const [rootType, setRootType] = useState<RootType>('AFE');
  const [selectedRoot, setSelectedRoot] = useState<string>('');
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableRoots, setAvailableRoots] = useState<any[]>([]);

  // Load available root nodes based on type
  useEffect(() => {
    let roots: any[] = [];

    switch (rootType) {
      case 'AFE':
        roots = getStaticAFEs().map((afe) => ({
          id: afe.afeId.toString(),
          label: `${afe.afeNumber} - ${afe.description}`,
          value: afe.afeId.toString(),
        }));
        break;
      case 'Deck':
        roots = getStaticDecks().map((deck) => ({
          id: deck.deckId.toString(),
          label: `${deck.deckCode} - ${deck.description}`,
          value: deck.deckId.toString(),
        }));
        break;
      case 'Owner':
        roots = getStaticOwners().map((owner) => ({
          id: owner.ownerId.toString(),
          label: owner.ownerName,
          value: owner.ownerId.toString(),
        }));
        break;
    }

    setAvailableRoots(roots);
    if (roots.length > 0) {
      setSelectedRoot(roots[0].value);
    }
  }, [rootType]);

  // Build hierarchy when root selection changes
  useEffect(() => {
    if (!selectedRoot) return;

    const transactions = getStaticTransactions();
    const afes = getStaticAFEs();
    const decks = getStaticDecks();
    const owners = getStaticOwners();

    let hierarchy: HierarchyNode | null = null;

    switch (rootType) {
      case 'AFE': {
        const afe = afes.find((a) => a.afeId.toString() === selectedRoot);
        if (!afe) break;

        const afeTransactions = transactions.filter((t) => t.afeId === afe.afeId);
        const totalSpent = afeTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Build transaction children with owner allocations
        const transactionNodes: HierarchyNode[] = afeTransactions.map((txn) => {
          const ownerNodes: HierarchyNode[] = (txn.owners || []).map((owner) => ({
            id: `owner-${owner.ownerId}-${txn.txnId}`,
            label: owner.ownerName,
            type: 'Owner',
            amount: owner.allocatedAmount,
            metadata: {
              allocation: owner.allocationPercentage.toFixed(1),
            },
          }));

          return {
            id: `txn-${txn.txnId}`,
            label: `Transaction #${txn.txnId}`,
            type: 'Transaction',
            amount: txn.amount,
            metadata: {
              description: txn.description,
              status: txn.status,
            },
            children: ownerNodes.length > 0 ? ownerNodes : undefined,
          };
        });

        hierarchy = {
          id: `afe-${afe.afeId}`,
          label: afe.afeNumber,
          type: 'AFE',
          amount: totalSpent,
          count: afeTransactions.length,
          metadata: {
            description: afe.description,
            status: afe.status,
            budget: afe.totalBudget,
          },
          children: transactionNodes,
        };
        break;
      }

      case 'Deck': {
        const deck = decks.find((d) => d.deckId.toString() === selectedRoot);
        if (!deck) break;

        const deckTransactions = transactions.filter((t) => t.deckId === deck.deckId);
        const totalSpent = deckTransactions.reduce((sum, t) => sum + t.amount, 0);

        const transactionNodes: HierarchyNode[] = deckTransactions.map((txn) => {
          const afe = afes.find((a) => a.afeId === txn.afeId);
          const ownerNodes: HierarchyNode[] = (txn.owners || []).map((owner) => ({
            id: `owner-${owner.ownerId}-${txn.txnId}`,
            label: owner.ownerName,
            type: 'Owner',
            amount: owner.allocatedAmount,
            metadata: {
              allocation: owner.allocationPercentage.toFixed(1),
            },
          }));

          return {
            id: `txn-${txn.txnId}`,
            label: `Transaction #${txn.txnId}${afe ? ` (${afe.afeNumber})` : ''}`,
            type: 'Transaction',
            amount: txn.amount,
            metadata: {
              description: txn.description,
              status: txn.status,
            },
            children: ownerNodes.length > 0 ? ownerNodes : undefined,
          };
        });

        hierarchy = {
          id: `deck-${deck.deckId}`,
          label: deck.deckCode,
          type: 'Deck',
          amount: totalSpent,
          count: deckTransactions.length,
          metadata: {
            description: deck.description,
            type: deck.deckType,
          },
          children: transactionNodes,
        };
        break;
      }

      case 'Owner': {
        const owner = owners.find((o) => o.ownerId.toString() === selectedRoot);
        if (!owner) break;

        // Find all transactions allocated to this owner
        const ownerTransactions = transactions.filter(
          (t) => t.owners && t.owners.some((o) => o.ownerId === owner.ownerId)
        );

        const transactionNodes: HierarchyNode[] = ownerTransactions.map((txn) => {
          const ownerAllocation = txn.owners!.find((o) => o.ownerId === owner.ownerId);
          const afe = afes.find((a) => a.afeId === txn.afeId);
          const deck = decks.find((d) => d.deckId === txn.deckId);

          return {
            id: `txn-${txn.txnId}`,
            label: `Transaction #${txn.txnId}`,
            type: 'Transaction',
            amount: ownerAllocation?.allocatedAmount || 0,
            metadata: {
              description: txn.description,
              status: txn.status,
              allocation: ownerAllocation?.allocationPercentage.toFixed(1),
              afe: afe?.afeNumber,
              deck: deck?.deckCode,
            },
          };
        });

        hierarchy = {
          id: `owner-${owner.ownerId}`,
          label: owner.ownerName,
          type: 'Owner',
          amount: owner.totalRevenue,
          count: ownerTransactions.length,
          metadata: {
            status: owner.ownerStatus,
            interestType: owner.interestTypeCode,
          },
          children: transactionNodes,
        };
        break;
      }
    }

    setHierarchyData(hierarchy);
  }, [selectedRoot, rootType]);

  const handleNodeClick = (node: HierarchyNode) => {
    console.log('Node clicked:', node);
    // Could navigate to detail page or show modal
  };

  const filteredRoots = availableRoots.filter((root) =>
    root.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="slide-in">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Relationship Explorer
        </h1>
        <p className="text-muted-foreground mt-1">
          Navigate parent-child hierarchies and explore data relationships
        </p>
      </div>

      {/* Controls */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-purple-500" />
            Hierarchy Settings
          </CardTitle>
          <CardDescription>Select the root node type and specific entity to explore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Root Node Type</label>
              <Select value={rootType} onValueChange={(value) => setRootType(value as RootType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AFE">AFE (Budget Authorization)</SelectItem>
                  <SelectItem value="Deck">Deck (Cost Center)</SelectItem>
                  <SelectItem value="Owner">Owner (Stakeholder)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Entity</label>
              <Select value={selectedRoot} onValueChange={setSelectedRoot}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredRoots.map((root) => (
                    <SelectItem key={root.value} value={root.value}>
                      {root.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Visualization */}
      {hierarchyData && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-500" />
              Hierarchy Tree
            </CardTitle>
            <CardDescription>
              Click nodes to explore details, expand/collapse to navigate levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-4xl">
              <HierarchyTree
                data={hierarchyData}
                onNodeClick={handleNodeClick}
                maxDepth={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relationship Summary */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Common Relationship Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge className="bg-purple-500">AFE</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge className="bg-green-500">Transaction</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge className="bg-orange-500">Owner</Badge>
              </h4>
              <p className="text-sm text-muted-foreground">
                AFEs fund transactions, which are allocated to owners based on interest percentages
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge className="bg-blue-500">Deck</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge className="bg-green-500">Transaction</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge className="bg-purple-500">AFE</Badge>
              </h4>
              <p className="text-sm text-muted-foreground">
                Cost centers (Decks) charge transactions to specific budget authorizations (AFEs)
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge className="bg-pink-500">Invoice</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge className="bg-cyan-500">Payment</Badge>
              </h4>
              <p className="text-sm text-muted-foreground">
                Invoices are paid through payment records, tracking vendor settlements
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge className="bg-orange-500">Owner</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge className="bg-green-500">Transaction</Badge>
              </h4>
              <p className="text-sm text-muted-foreground">
                Owners receive revenue allocations from transactions based on their interest type
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
