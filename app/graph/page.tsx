'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Maximize2 } from 'lucide-react';
import { NODE_COLORS } from '@/lib/constants';

const nodeTypes = {
  Transaction: 'default',
  AFE: 'default',
  Deck: 'default',
  Owner: 'default',
  BillingCategory: 'default',
  Invoice: 'default',
  Payment: 'default',
};

export default function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [centerNode, setCenterNode] = useState('');
  const [depth, setDepth] = useState('2');
  const [stats, setStats] = useState({ nodes: 0, edges: 0, types: {} });

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (centerNode) params.append('centerNode', centerNode);
      if (depth) params.append('depth', depth);

      const response = await fetch(`/api/graph/network?${params}`);
      const result = await response.json();

      if (result.success) {
        const graphData = result.data;

        // Convert to ReactFlow format
        const flowNodes: Node[] = (graphData.nodes || []).map((node: any, index: number) => ({
          id: node.id,
          type: 'default',
          position: {
            x: (index % 5) * 250,
            y: Math.floor(index / 5) * 150,
          },
          data: {
            label: (
              <div className="px-3 py-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  {node.type}
                </div>
                <div className="text-sm font-medium">{node.label}</div>
              </div>
            ),
          },
          style: {
            background: NODE_COLORS[node.type] || '#6b7280',
            color: 'white',
            border: '2px solid #fff',
            borderRadius: '8px',
            padding: '0',
            minWidth: '180px',
          },
        }));

        const flowEdges: Edge[] = (graphData.edges || []).map((edge: any) => ({
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          label: edge.type,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            stroke: '#888',
            strokeWidth: 2,
          },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);

        // Calculate stats
        const typeCounts = flowNodes.reduce((acc: any, node: any) => {
          const type = node.data?.label?.props?.children?.[0]?.props?.children || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        setStats({
          nodes: flowNodes.length,
          edges: flowEdges.length,
          types: typeCounts,
        });
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setLoading(false);
    }
  }, [centerNode, depth, setNodes, setEdges]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const handleRefresh = () => {
    fetchGraphData();
  };

  const handleFitView = useCallback(() => {
    // Trigger fit view programmatically
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading graph data...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b bg-background p-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Graph Visualization</h1>
          <p className="text-muted-foreground">
            Interactive network view of financial relationships
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Center node (optional)"
              value={centerNode}
              onChange={(e) => setCenterNode(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={depth} onValueChange={setDepth}>
            <SelectTrigger>
              <SelectValue placeholder="Graph depth" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Level 0 - Schema</SelectItem>
              <SelectItem value="1">Level 1 - High-level</SelectItem>
              <SelectItem value="2">Level 2 - Medium</SelectItem>
              <SelectItem value="3">Level 3 - Detailed</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button onClick={handleFitView} variant="outline">
            <Maximize2 className="mr-2 h-4 w-4" />
            Fit View
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">
            {stats.nodes} Nodes
          </Badge>
          <Badge variant="outline">
            {stats.edges} Edges
          </Badge>
          {Object.entries(stats.types).map(([type, count]) => (
            <Badge
              key={type}
              style={{
                backgroundColor: NODE_COLORS[type] || '#6b7280',
                color: 'white',
              }}
            >
              {type}: {count}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-muted/10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <Panel position="top-right">
            <Card className="w-64">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs">{type}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
