'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Layers, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CURRENCY_FORMAT, NUMBER_FORMAT } from '@/lib/constants';

export interface HierarchyNode {
  id: string;
  label: string;
  type: string;
  amount?: number;
  count?: number;
  children?: HierarchyNode[];
  metadata?: {
    [key: string]: any;
  };
}

interface HierarchyTreeProps {
  data: HierarchyNode;
  onNodeClick?: (node: HierarchyNode) => void;
  maxDepth?: number;
  currentDepth?: number;
}

export function HierarchyTree({
  data,
  onNodeClick,
  maxDepth = 3,
  currentDepth = 0,
}: HierarchyTreeProps) {
  const [isExpanded, setIsExpanded] = useState(currentDepth < 2);
  const hasChildren = data.children && data.children.length > 0;
  const canExpand = hasChildren && currentDepth < maxDepth;

  const nodeColors: { [key: string]: string } = {
    AFE: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
    Deck: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
    Transaction: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    Owner: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
    Invoice: 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
    Payment: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700',
  };

  const textColors: { [key: string]: string } = {
    AFE: 'text-purple-700 dark:text-purple-300',
    Deck: 'text-blue-700 dark:text-blue-300',
    Transaction: 'text-green-700 dark:text-green-300',
    Owner: 'text-orange-700 dark:text-orange-300',
    Invoice: 'text-pink-700 dark:text-pink-300',
    Payment: 'text-cyan-700 dark:text-cyan-300',
  };

  const nodeColor = nodeColors[data.type] || 'bg-gray-100 dark:bg-gray-800 border-gray-300';
  const textColor = textColors[data.type] || 'text-gray-700 dark:text-gray-300';

  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        {/* Expand/Collapse Button */}
        {canExpand && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 flex-shrink-0 hover:bg-muted rounded p-1 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
        {!canExpand && hasChildren && (
          <div className="mt-1 w-6 flex-shrink-0" /> /* Spacer for alignment */
        )}

        {/* Node Content */}
        <div
          className={`flex-1 min-w-0 p-3 rounded-lg border-2 ${nodeColor} hover:shadow-md transition-all cursor-pointer`}
          onClick={() => onNodeClick?.(data)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`text-xs ${textColor} border-current`}>
                  {data.type}
                </Badge>
                {hasChildren && (
                  <Badge variant="secondary" className="text-xs">
                    <Layers className="h-3 w-3 mr-1" />
                    {data.children!.length}
                  </Badge>
                )}
              </div>
              <div className={`font-semibold text-sm ${textColor} truncate`}>{data.label}</div>
              {data.metadata?.description && (
                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {data.metadata.description}
                </div>
              )}
            </div>

            {/* Amount/Count Display */}
            {(data.amount !== undefined || data.count !== undefined) && (
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {data.amount !== undefined && (
                  <div className="flex items-center gap-1 text-sm font-bold">
                    <DollarSign className="h-3 w-3" />
                    {CURRENCY_FORMAT.format(data.amount)}
                  </div>
                )}
                {data.count !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    {NUMBER_FORMAT.format(data.count)} items
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Metadata */}
          {data.metadata && Object.keys(data.metadata).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.metadata.status && (
                <Badge variant="outline" className="text-xs">
                  {data.metadata.status}
                </Badge>
              )}
              {data.metadata.allocation && (
                <Badge variant="secondary" className="text-xs">
                  {data.metadata.allocation}% allocated
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-muted pl-4">
          {data.children!.map((child, index) => (
            <HierarchyTree
              key={child.id || index}
              data={child}
              onNodeClick={onNodeClick}
              maxDepth={maxDepth}
              currentDepth={currentDepth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
