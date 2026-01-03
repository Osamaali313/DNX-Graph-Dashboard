// Validation Engine - Core validation logic

import {
  ValidationTest,
  ValidationResult,
  ValidationSuite,
  NodeCountComparison,
  RelationshipComparison,
  DataIntegrityIssue,
  ExpectedSchema,
} from './types';

// Expected schema based on build_graph_db.py
export const EXPECTED_SCHEMA: ExpectedSchema = {
  nodes: {
    Transaction: {
      count: 200,
      requiredProperties: ['txn_id', 'amount', 'txn_date', 'status'],
      uniqueConstraints: ['txn_id'],
    },
    AFE: {
      count: 30,
      requiredProperties: ['afe_id', 'afe_number', 'total_budget', 'status'],
      uniqueConstraints: ['afe_id'],
    },
    Deck: {
      count: 20,
      requiredProperties: ['deck_id', 'deck_code', 'description'],
      uniqueConstraints: ['deck_id'],
    },
    BillingCategory: {
      count: 25,
      requiredProperties: ['bill_cat_code', 'description'],
      uniqueConstraints: ['bill_cat_code'],
    },
    Owner: {
      count: 15,
      requiredProperties: ['owner_id', 'owner_name', 'owner_status'],
      uniqueConstraints: ['owner_id'],
    },
    Invoice: {
      count: 50,
      requiredProperties: ['invoice_id', 'invoice_number', 'amount'],
      uniqueConstraints: ['invoice_id'],
    },
    Payment: {
      count: 40,
      requiredProperties: ['payment_id', 'payment_number', 'amount'],
      uniqueConstraints: ['payment_id'],
    },
  },
  relationships: {
    CHARGED_TO: {
      from: 'Transaction',
      to: 'Deck',
      expectedCount: 200,
      cardinality: 'N:1',
      properties: ['amount'],
    },
    FUNDED_BY: {
      from: 'Transaction',
      to: 'AFE',
      expectedCount: 200,
      cardinality: 'N:1',
      properties: ['amount'],
    },
    CATEGORIZED_AS: {
      from: 'Transaction',
      to: 'BillingCategory',
      cardinality: 'N:1',
      // Note: Not all transactions have billing categories in current data
    },
    ALLOCATED_TO: {
      from: 'Transaction',
      to: 'Owner',
      cardinality: 'N:M',
      properties: ['allocation_percentage', 'allocated_amount'],
    },
    PAYS: {
      from: 'Payment',
      to: 'Invoice',
      expectedCount: 40,
      cardinality: 'N:1',
    },
  },
};

export class ValidationEngine {
  private tests: ValidationTest[] = [];

  // Schema Validation Tests
  createSchemaValidationSuite(actualCounts: { [key: string]: number }): ValidationSuite {
    const tests: ValidationTest[] = [];

    // Test 1: Node Count Validation
    Object.entries(EXPECTED_SCHEMA.nodes).forEach(([nodeType, config]) => {
      const actual = actualCounts[nodeType] || 0;
      const expected = config.count;
      const passed = actual === expected;

      tests.push({
        id: `node-count-${nodeType}`,
        name: `${nodeType} Node Count`,
        description: `Verify ${nodeType} node count matches expected value`,
        category: 'schema',
        status: passed ? 'passed' : 'failed',
        result: {
          passed,
          message: passed
            ? `${nodeType} count matches (${actual} nodes)`
            : `${nodeType} count mismatch: expected ${expected}, found ${actual}`,
          timestamp: new Date().toISOString(),
          severity: passed ? 'info' : 'error',
          metrics: {
            expected,
            actual,
            difference: actual - expected,
            percentage: expected > 0 ? Math.round(((actual - expected) / expected) * 100) : 0,
          },
        },
      });
    });

    // Test 2: Total Node Count
    const totalExpected = Object.values(EXPECTED_SCHEMA.nodes).reduce(
      (sum, config) => sum + config.count,
      0
    );
    const totalActual = Object.values(actualCounts).reduce((sum, count) => sum + count, 0);
    const totalPassed = Math.abs(totalActual - totalExpected) <= 5; // Allow 5 node tolerance

    tests.push({
      id: 'total-node-count',
      name: 'Total Node Count',
      description: 'Verify total number of nodes in database',
      category: 'schema',
      status: totalPassed ? 'passed' : 'warning',
      result: {
        passed: totalPassed,
        message: totalPassed
          ? `Total node count within tolerance (${totalActual} nodes)`
          : `Total node count variance: expected ~${totalExpected}, found ${totalActual}`,
        timestamp: new Date().toISOString(),
        severity: totalPassed ? 'info' : 'warning',
        metrics: {
          expected: totalExpected,
          actual: totalActual,
          difference: totalActual - totalExpected,
        },
      },
    });

    return {
      name: 'Schema Validation',
      tests,
      status: 'completed',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
    };
  }

  // Relationship Validation Tests
  createRelationshipValidationSuite(
    actualRelationships: { [key: string]: number }
  ): ValidationSuite {
    const tests: ValidationTest[] = [];

    Object.entries(EXPECTED_SCHEMA.relationships).forEach(([relType, config]) => {
      const actual = actualRelationships[relType] || 0;
      const expected = config.expectedCount;

      if (expected !== undefined) {
        const passed = actual === expected;
        const withinTolerance = Math.abs(actual - expected) <= Math.ceil(expected * 0.1); // 10% tolerance

        tests.push({
          id: `rel-count-${relType}`,
          name: `${relType} Relationship Count`,
          description: `Verify ${config.from} → ${config.to} relationship count`,
          category: 'relationships',
          status: passed ? 'passed' : withinTolerance ? 'warning' : 'failed',
          result: {
            passed: withinTolerance,
            message: passed
              ? `${relType} count matches (${actual} relationships)`
              : withinTolerance
              ? `${relType} within tolerance: expected ${expected}, found ${actual}`
              : `${relType} count mismatch: expected ${expected}, found ${actual}`,
            timestamp: new Date().toISOString(),
            severity: passed ? 'info' : withinTolerance ? 'warning' : 'error',
            metrics: {
              expected,
              actual,
              difference: actual - expected,
              percentage:
                expected > 0 ? Math.round(((actual - expected) / expected) * 100) : 0,
            },
          },
        });
      }
    });

    return {
      name: 'Relationship Validation',
      tests,
      status: 'completed',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
    };
  }

  // Data Integrity Tests
  createIntegrityValidationSuite(integrityData: {
    orphanedNodes: { [key: string]: number };
    invalidAllocations: number;
    overBudgetAFEs: number;
    missingRelationships: { [key: string]: number };
  }): ValidationSuite {
    const tests: ValidationTest[] = [];

    // Test 1: Orphaned Nodes
    const totalOrphans = Object.values(integrityData.orphanedNodes).reduce(
      (sum, count) => sum + count,
      0
    );
    const orphansPassed = totalOrphans === 0;

    tests.push({
      id: 'orphaned-nodes',
      name: 'Orphaned Nodes Check',
      description: 'Verify no nodes exist without relationships',
      category: 'integrity',
      status: orphansPassed ? 'passed' : 'warning',
      result: {
        passed: orphansPassed,
        message: orphansPassed
          ? 'No orphaned nodes found'
          : `Found ${totalOrphans} orphaned nodes`,
        details: integrityData.orphanedNodes,
        timestamp: new Date().toISOString(),
        severity: orphansPassed ? 'info' : 'warning',
        metrics: {
          expected: 0,
          actual: totalOrphans,
          difference: totalOrphans,
        },
      },
    });

    // Test 2: Allocation Integrity
    const allocationsPassed = integrityData.invalidAllocations === 0;

    tests.push({
      id: 'allocation-integrity',
      name: 'Owner Allocation Integrity',
      description: 'Verify allocation percentages sum to 100%',
      category: 'integrity',
      status: allocationsPassed ? 'passed' : 'warning',
      result: {
        passed: allocationsPassed,
        message: allocationsPassed
          ? 'All allocations sum to 100%'
          : `Found ${integrityData.invalidAllocations} transactions with allocation issues`,
        timestamp: new Date().toISOString(),
        severity: allocationsPassed ? 'info' : 'warning',
        metrics: {
          expected: 0,
          actual: integrityData.invalidAllocations,
          difference: integrityData.invalidAllocations,
        },
      },
    });

    // Test 3: Budget Overruns
    const budgetPassed = integrityData.overBudgetAFEs === 0;

    tests.push({
      id: 'budget-overruns',
      name: 'AFE Budget Overruns',
      description: 'Verify no AFEs exceed their budget',
      category: 'integrity',
      status: budgetPassed ? 'passed' : 'warning',
      result: {
        passed: budgetPassed,
        message: budgetPassed
          ? 'No AFEs over budget'
          : `Found ${integrityData.overBudgetAFEs} AFEs over budget`,
        timestamp: new Date().toISOString(),
        severity: budgetPassed ? 'info' : 'warning',
        metrics: {
          expected: 0,
          actual: integrityData.overBudgetAFEs,
          difference: integrityData.overBudgetAFEs,
        },
      },
    });

    return {
      name: 'Data Integrity',
      tests,
      status: 'completed',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
    };
  }

  // Data Quality Tests
  createQualityValidationSuite(qualityMetrics: {
    completenessScore: number;
    consistencyScore: number;
    accuracyScore: number;
  }): ValidationSuite {
    const tests: ValidationTest[] = [];

    // Completeness Test
    const completenessPassed = qualityMetrics.completenessScore >= 95;

    tests.push({
      id: 'data-completeness',
      name: 'Data Completeness',
      description: 'Verify percentage of non-null required fields',
      category: 'quality',
      status: completenessPassed ? 'passed' : 'warning',
      result: {
        passed: completenessPassed,
        message: `Data completeness: ${qualityMetrics.completenessScore.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        severity: completenessPassed ? 'info' : 'warning',
        metrics: {
          expected: 100,
          actual: qualityMetrics.completenessScore,
          difference: 100 - qualityMetrics.completenessScore,
        },
      },
    });

    // Consistency Test
    const consistencyPassed = qualityMetrics.consistencyScore >= 95;

    tests.push({
      id: 'data-consistency',
      name: 'Data Consistency',
      description: 'Verify referential integrity across relationships',
      category: 'quality',
      status: consistencyPassed ? 'passed' : 'warning',
      result: {
        passed: consistencyPassed,
        message: `Data consistency: ${qualityMetrics.consistencyScore.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        severity: consistencyPassed ? 'info' : 'warning',
        metrics: {
          expected: 100,
          actual: qualityMetrics.consistencyScore,
          difference: 100 - qualityMetrics.consistencyScore,
        },
      },
    });

    // Accuracy Test
    const accuracyPassed = qualityMetrics.accuracyScore >= 95;

    tests.push({
      id: 'data-accuracy',
      name: 'Data Accuracy',
      description: 'Verify data type validation and range checks',
      category: 'quality',
      status: accuracyPassed ? 'passed' : 'warning',
      result: {
        passed: accuracyPassed,
        message: `Data accuracy: ${qualityMetrics.accuracyScore.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        severity: accuracyPassed ? 'info' : 'warning',
        metrics: {
          expected: 100,
          actual: qualityMetrics.accuracyScore,
          difference: 100 - qualityMetrics.accuracyScore,
        },
      },
    });

    return {
      name: 'Data Quality',
      tests,
      status: 'completed',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
    };
  }
}
