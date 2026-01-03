'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Copy, Download, BookOpen } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';

const SAMPLE_QUERIES = [
  {
    name: 'All Transactions',
    query: 'MATCH (t:Transaction)\nRETURN t.txn_id as id, t.amount as amount, t.description as description\nLIMIT 25',
  },
  {
    name: 'AFE Budget Status',
    query: 'MATCH (a:AFE)\nOPTIONAL MATCH (t:Transaction)-[:FUNDED_BY]->(a)\nRETURN a.afe_number as afe, a.total_budget as budget, sum(t.amount) as spent\nORDER BY spent DESC\nLIMIT 10',
  },
  {
    name: 'Transaction Flow',
    query: 'MATCH (t:Transaction)-[:CHARGED_TO]->(d:Deck)\nRETURN t.txn_id as transaction, d.deck_code as deck, t.amount as amount\nLIMIT 25',
  },
  {
    name: 'Owner Allocations',
    query: 'MATCH (o:Owner)<-[a:ALLOCATED_TO]-(t:Transaction)\nRETURN o.owner_name as owner, count(t) as transactions, sum(a.allocated_amount) as revenue\nORDER BY revenue DESC\nLIMIT 10',
  },
  {
    name: 'Deck Spending',
    query: 'MATCH (t:Transaction)-[:CHARGED_TO]->(d:Deck)\nRETURN d.deck_code as deck, d.description as description, count(t) as count, sum(t.amount) as total\nORDER BY total DESC\nLIMIT 15',
  },
];

export default function QueryPage() {
  const [query, setQuery] = useState(SAMPLE_QUERIES[0].query);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [executionTime, setExecutionTime] = useState(0);

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError('');
    const startTime = Date.now();

    try {
      const response = await fetch('/api/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (result.success) {
        setResults(result.data || []);
      } else {
        setError(result.error || 'Query execution failed');
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute query');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
    setResults([]);
    setError('');
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
  };

  const exportResults = () => {
    const json = JSON.stringify(results, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.json`;
    a.click();
  };

  // Generate table columns from results
  const generateColumns = () => {
    if (results.length === 0) return [];

    const firstResult = results[0];
    return Object.keys(firstResult).map((key) => ({
      key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      render: (item: any) => {
        const value = item[key];
        if (typeof value === 'number') {
          return <span className="font-medium">{value.toLocaleString()}</span>;
        }
        return <span>{value?.toString() || '-'}</span>;
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Query Builder</h1>
        <p className="text-muted-foreground">
          Execute custom Cypher queries against the graph database
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cypher Query</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your Cypher query here..."
                className="font-mono text-sm min-h-[200px]"
              />

              <div className="flex items-center gap-2">
                <Button onClick={executeQuery} disabled={loading}>
                  <Play className="mr-2 h-4 w-4" />
                  {loading ? 'Executing...' : 'Execute Query'}
                </Button>
                <Button onClick={copyQuery} variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                {results.length > 0 && (
                  <Button onClick={exportResults} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {results.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{results.length} results</Badge>
                  <Badge variant="outline">{executionTime}ms</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Query Results</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={results}
                  columns={generateColumns()}
                  emptyMessage="No results found"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Sample Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SAMPLE_QUERIES.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => loadSampleQuery(sample.query)}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="font-medium">{sample.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2 font-mono">
                    {sample.query}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Query Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div>
                <strong>MATCH</strong> - Find patterns in the graph
              </div>
              <div>
                <strong>WHERE</strong> - Filter results
              </div>
              <div>
                <strong>RETURN</strong> - Specify what to return
              </div>
              <div>
                <strong>LIMIT</strong> - Limit number of results
              </div>
              <div>
                <strong>ORDER BY</strong> - Sort results
              </div>
              <div className="mt-3 rounded bg-yellow-50 p-2 text-yellow-800">
                <strong>Note:</strong> Only READ queries are allowed for security
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
