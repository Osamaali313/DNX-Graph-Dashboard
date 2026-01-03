'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Database, Layers, Network } from 'lucide-react';

interface NodeType {
  label: string;
  description: string;
  color: string;
  icon: string;
  properties: string[];
  sampleCount: number;
}

interface RelationshipType {
  type: string;
  from: string;
  to: string;
  description: string;
  cardinality: string;
  properties: string[];
  sampleCount: number;
}

interface SchemaData {
  nodeTypes: NodeType[];
  relationshipTypes: RelationshipType[];
  hierarchy: any;
  metadata: any;
}

export default function SchemaPage() {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/graph/schema')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setSchema(result.data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching schema:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="shimmer text-muted-foreground">Loading schema...</div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Failed to load schema</div>
      </div>
    );
  }

  const getRelationshipsForNode = (nodeLabel: string) => {
    return schema.relationshipTypes.filter(
      (rel) => rel.from === nodeLabel || rel.to === nodeLabel
    );
  };

  const selectedNodeData = selectedNode
    ? schema.nodeTypes.find((n) => n.label === selectedNode)
    : null;

  const selectedNodeRelationships = selectedNode ? getRelationshipsForNode(selectedNode) : [];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="slide-in">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Graph Schema Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Level 0: High-level view of database structure and relationships
        </p>
      </div>

      {/* Metadata Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-hover border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Node Types
            </CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schema.nodeTypes.length}</div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Relationship Types
            </CardTitle>
            <Network className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schema.relationshipTypes.length}</div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Nodes
            </CardTitle>
            <Layers className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schema.metadata.totalNodes}</div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Relationships
            </CardTitle>
            <ArrowRight className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schema.metadata.totalRelationships}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Node Types List */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              Node Types
            </CardTitle>
            <CardDescription>Click a node to see its details and relationships</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {schema.nodeTypes.map((node) => (
              <button
                key={node.label}
                onClick={() => setSelectedNode(node.label)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedNode === node.label
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                    : 'border-border hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: node.color }}
                    ></div>
                    <span className="font-semibold">{node.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {node.sampleCount}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {node.description}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Schema Visualization */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-500" />
              {selectedNode ? `${selectedNode} Relationships` : 'Schema Diagram'}
            </CardTitle>
            <CardDescription>
              {selectedNode
                ? `Showing all relationships connected to ${selectedNode}`
                : 'Select a node type to view its relationships'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedNodeData ? (
              <div className="space-y-6">
                {/* Node Details */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: selectedNodeData.color }}
                    >
                      {selectedNodeData.label[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{selectedNodeData.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedNodeData.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Properties:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNodeData.properties.map((prop) => (
                        <Badge key={prop} variant="outline" className="font-mono text-xs">
                          {prop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Relationships */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Relationships ({selectedNodeRelationships.length})
                  </h4>
                  {selectedNodeRelationships.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No relationships defined for this node type
                    </p>
                  ) : (
                    selectedNodeRelationships.map((rel, idx) => {
                      const isOutgoing = rel.from === selectedNode;
                      const otherNode = isOutgoing ? rel.to : rel.from;
                      const otherNodeData = schema.nodeTypes.find((n) => n.label === otherNode);

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {isOutgoing ? (
                              <>
                                <div
                                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                  style={{ backgroundColor: selectedNodeData.color }}
                                >
                                  {selectedNode[0]}
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div
                                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                  style={{ backgroundColor: otherNodeData?.color }}
                                >
                                  {otherNode[0]}
                                </div>
                              </>
                            ) : (
                              <>
                                <div
                                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                  style={{ backgroundColor: otherNodeData?.color }}
                                >
                                  {otherNode[0]}
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div
                                  className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                  style={{ backgroundColor: selectedNodeData.color }}
                                >
                                  {selectedNode[0]}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="ml-11">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{rel.type}</span>
                              <Badge variant="secondary" className="text-xs">
                                {rel.cardinality}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {rel.sampleCount} relations
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{rel.description}</p>
                            {rel.properties.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {rel.properties.map((prop) => (
                                  <Badge
                                    key={prop}
                                    variant="outline"
                                    className="font-mono text-xs"
                                  >
                                    {prop}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Network className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Select a node type from the list to view its relationships and properties
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Relationships Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>All Relationship Types</CardTitle>
          <CardDescription>Complete overview of all relationships in the graph</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Relationship</th>
                  <th className="px-4 py-3 text-left">From → To</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-center">Cardinality</th>
                  <th className="px-4 py-3 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {schema.relationshipTypes.map((rel, idx) => {
                  const fromNode = schema.nodeTypes.find((n) => n.label === rel.from);
                  const toNode = schema.nodeTypes.find((n) => n.label === rel.to);

                  return (
                    <tr key={idx} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3 font-semibold">{rel.type}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: fromNode?.color }}
                          ></span>
                          <span>{rel.from}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: toNode?.color }}
                          ></span>
                          <span>{rel.to}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{rel.description}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {rel.cardinality}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{rel.sampleCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
