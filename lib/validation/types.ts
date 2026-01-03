// Validation Types and Interfaces

export interface ValidationTest {
  id: string;
  name: string;
  description: string;
  category: 'schema' | 'data' | 'relationships' | 'integrity' | 'quality';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  result?: ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  metrics?: {
    expected: number;
    actual: number;
    difference: number;
    percentage?: number;
  };
}

export interface ValidationSuite {
  name: string;
  tests: ValidationTest[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  summary?: ValidationSummary;
}

export interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  pending: number;
  successRate: number;
  duration?: number;
}

export interface NodeCountComparison {
  nodeType: string;
  expected: number; // From build_graph_db.py config
  actual: number; // From Neo4j query
  match: boolean;
  difference: number;
}

export interface RelationshipComparison {
  relationshipType: string;
  fromType: string;
  toType: string;
  expected: number;
  actual: number;
  match: boolean;
  difference: number;
}

export interface DataIntegrityIssue {
  type: 'orphan' | 'missing_relationship' | 'invalid_allocation' | 'budget_overrun' | 'null_required_field';
  severity: 'low' | 'medium' | 'high' | 'critical';
  nodeId?: string;
  nodeType?: string;
  description: string;
  affectedCount: number;
  examples?: any[];
}

export interface ValidationReport {
  timestamp: string;
  version: string;
  environment: string;
  summary: ValidationSummary;
  suites: ValidationSuite[];
  nodeComparisons: NodeCountComparison[];
  relationshipComparisons: RelationshipComparison[];
  integrityIssues: DataIntegrityIssue[];
  recommendations: string[];
}

export interface ExpectedSchema {
  nodes: {
    [nodeType: string]: {
      count: number;
      requiredProperties: string[];
      uniqueConstraints: string[];
    };
  };
  relationships: {
    [relType: string]: {
      from: string;
      to: string;
      expectedCount?: number;
      cardinality: 'N:1' | '1:N' | 'N:M' | '1:1';
      properties?: string[];
    };
  };
}
