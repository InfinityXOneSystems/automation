export interface Config {
  failureThreshold: number;
  failureRateThreshold: number;
  timeWindowDays: number;
  excludeRepositories: string[];
  safelistWorkflows: string[];
  dryRun: boolean;
  githubToken?: string;
  organization: string;
  maxConcurrentRequests: number;
  backupDirectory: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  run_number: number;
  html_url: string;
}

export interface WorkflowInfo {
  name: string;
  path: string;
  state: string;
  id: number;
}

export interface WorkflowAnalysis {
  repository: string;
  workflowName: string;
  workflowPath: string;
  workflowId: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  failureRate: number;
  consecutiveFailures: number;
  lastRuns: WorkflowRun[];
  lastSuccessfulRun: WorkflowRun | null;
  shouldDisable: boolean;
  disableReason: string[];
  issues: string[];
}

export interface RepositoryAnalysis {
  repository: string;
  totalWorkflows: number;
  failingWorkflows: number;
  workflows: WorkflowAnalysis[];
}

export interface AnalysisReport {
  timestamp: string;
  organization: string;
  totalRepositories: number;
  totalWorkflows: number;
  failingWorkflows: number;
  successRate: number;
  repositories: RepositoryAnalysis[];
  summary: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
  };
}

export interface DisabledWorkflow {
  repository: string;
  workflowName: string;
  originalPath: string;
  disabledPath: string;
  backupPath: string;
  disabledAt: string;
  reason: string[];
  analysis: WorkflowAnalysis;
}

export interface DisabledWorkflowsManifest {
  timestamp: string;
  disabledWorkflows: DisabledWorkflow[];
}

export interface AuditLogEntry {
  timestamp: string;
  action: 'analyze' | 'disable' | 'restore' | 'backup';
  repository?: string;
  workflow?: string;
  details: Record<string, any>;
  success: boolean;
  error?: string;
}

export interface AuditLog {
  entries: AuditLogEntry[];
}
