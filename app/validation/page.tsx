'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
} from 'lucide-react';
import { ValidationReport, ValidationSuite, ValidationTest } from '@/lib/validation/types';

export default function ValidationPage() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runValidation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/validation/run');
      const result = await response.json();

      if (result.success) {
        setReport(result.data);
        setLastRun(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Error running validation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      passed: 'default',
      failed: 'destructive',
      warning: 'secondary',
      pending: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="gap-1">
        {getStatusIcon(status)}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const exportReport = () => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between slide-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Data Validation
          </h1>
          <p className="text-muted-foreground mt-1">
            Verify graph data integrity and compare against expected schema
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runValidation} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Run Validation
              </>
            )}
          </Button>
          <Button onClick={exportReport} variant="outline" disabled={!report}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {loading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 mx-auto text-purple-500 animate-spin mb-4" />
              <p className="text-muted-foreground">Running validation tests...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {report && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="card-hover border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tests
                </CardTitle>
                <PlayCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed in {report.summary.duration}ms
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Passed
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{report.summary.passed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {report.summary.successRate.toFixed(1)}% success rate
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Warnings
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {report.summary.warnings}
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Failed
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{report.summary.failed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Test Suites */}
          <div className="space-y-4">
            {report.suites.map((suite, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{suite.name}</span>
                    <Badge variant="outline">
                      {suite.tests.filter((t) => t.status === 'passed').length} /{' '}
                      {suite.tests.length} passed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.tests.map((test, testIdx) => (
                      <div
                        key={testIdx}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="pt-0.5">{getStatusIcon(test.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{test.name}</h4>
                            {getStatusBadge(test.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {test.description}
                          </p>
                          {test.result && (
                            <div className="text-sm">
                              <p
                                className={
                                  test.result.passed
                                    ? 'text-green-600 dark:text-green-400'
                                    : test.result.severity === 'warning'
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                              >
                                {test.result.message}
                              </p>
                              {test.result.metrics && (
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Expected: {test.result.metrics.expected}</span>
                                  <span>Actual: {test.result.metrics.actual}</span>
                                  <span>
                                    Difference: {test.result.metrics.difference > 0 ? '+' : ''}
                                    {test.result.metrics.difference}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Node Comparisons */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Node Count Comparison</CardTitle>
              <CardDescription>Expected vs actual node counts by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">Node Type</th>
                      <th className="px-4 py-3 text-right">Expected</th>
                      <th className="px-4 py-3 text-right">Actual</th>
                      <th className="px-4 py-3 text-right">Difference</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.nodeComparisons.map((comp, idx) => (
                      <tr key={idx} className="border-b border-border">
                        <td className="px-4 py-3 font-semibold">{comp.nodeType}</td>
                        <td className="px-4 py-3 text-right">{comp.expected}</td>
                        <td className="px-4 py-3 text-right">{comp.actual}</td>
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            comp.difference === 0
                              ? 'text-green-600'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          {comp.difference > 0 ? '+' : ''}
                          {comp.difference}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {comp.match ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Relationship Comparisons */}
          {report.relationshipComparisons.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Relationship Count Comparison</CardTitle>
                <CardDescription>Expected vs actual relationship counts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left">Relationship</th>
                        <th className="px-4 py-3 text-left">From → To</th>
                        <th className="px-4 py-3 text-right">Expected</th>
                        <th className="px-4 py-3 text-right">Actual</th>
                        <th className="px-4 py-3 text-right">Difference</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.relationshipComparisons.map((comp, idx) => (
                        <tr key={idx} className="border-b border-border">
                          <td className="px-4 py-3 font-semibold">{comp.relationshipType}</td>
                          <td className="px-4 py-3">
                            {comp.fromType} → {comp.toType}
                          </td>
                          <td className="px-4 py-3 text-right">{comp.expected}</td>
                          <td className="px-4 py-3 text-right">{comp.actual}</td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${
                              comp.difference === 0
                                ? 'text-green-600'
                                : 'text-yellow-600 dark:text-yellow-400'
                            }`}
                          >
                            {comp.difference > 0 ? '+' : ''}
                            {comp.difference}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {comp.match ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integrity Issues */}
          {report.integrityIssues.length > 0 && (
            <Card className="border-0 shadow-lg border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Data Integrity Issues
                </CardTitle>
                <CardDescription>Issues that require attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.integrityIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{issue.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {issue.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Affected: {issue.affectedCount} record(s)
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Suggested actions based on validation results</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {idx + 1}
                      </span>
                    </div>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
