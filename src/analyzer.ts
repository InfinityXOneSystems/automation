import yaml from 'js-yaml';
import {
  Config,
  WorkflowAnalysis,
  RepositoryAnalysis,
  AnalysisReport,
} from './types.js';
import { GitHubClient } from './github-client.js';

export class WorkflowAnalyzer {
  private client: GitHubClient;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new GitHubClient(config);
  }

  async analyze(): Promise<AnalysisReport> {
    console.log('Starting workflow analysis...');
    await this.client.checkRateLimit();

    const repositories = await this.client.getOrganizationRepositories();
    console.log(`Found ${repositories.length} repositories to analyze`);

    const repositoryAnalyses: RepositoryAnalysis[] = [];
    let totalWorkflows = 0;
    let failingWorkflows = 0;
    let totalRuns = 0;
    let successfulRuns = 0;
    let failedRuns = 0;

    for (const repo of repositories) {
      console.log(`Analyzing repository: ${repo}`);
      const repoAnalysis = await this.analyzeRepository(repo);
      
      if (repoAnalysis.workflows.length > 0) {
        repositoryAnalyses.push(repoAnalysis);
        totalWorkflows += repoAnalysis.totalWorkflows;
        failingWorkflows += repoAnalysis.failingWorkflows;

        for (const workflow of repoAnalysis.workflows) {
          totalRuns += workflow.totalRuns;
          successfulRuns += workflow.successfulRuns;
          failedRuns += workflow.failedRuns;
        }
      }
    }

    const successRate =
      totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(2) : '0';

    const report: AnalysisReport = {
      timestamp: new Date().toISOString(),
      organization: this.config.organization,
      totalRepositories: repositoryAnalyses.length,
      totalWorkflows,
      failingWorkflows,
      successRate: parseFloat(successRate),
      repositories: repositoryAnalyses,
      summary: {
        totalRuns,
        successfulRuns,
        failedRuns,
      },
    };

    console.log('Analysis complete!');
    return report;
  }

  private async analyzeRepository(repo: string): Promise<RepositoryAnalysis> {
    const workflows = await this.client.getWorkflows(repo);
    const workflowAnalyses: WorkflowAnalysis[] = [];

    for (const workflow of workflows) {
      const analysis = await this.analyzeWorkflow(repo, workflow);
      workflowAnalyses.push(analysis);
    }

    const failingCount = workflowAnalyses.filter((w) => w.shouldDisable).length;

    return {
      repository: repo,
      totalWorkflows: workflows.length,
      failingWorkflows: failingCount,
      workflows: workflowAnalyses,
    };
  }

  private async analyzeWorkflow(
    repo: string,
    workflow: { name: string; path: string; id: number; state: string }
  ): Promise<WorkflowAnalysis> {
    // Calculate date for time window
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - this.config.timeWindowDays);
    const created = `>=${sinceDate.toISOString()}`;

    const runs = await this.client.getWorkflowRuns(repo, workflow.id, created);

    // Calculate metrics
    const totalRuns = runs.length;
    const successfulRuns = runs.filter(
      (r) => r.conclusion === 'success'
    ).length;
    const failedRuns = runs.filter(
      (r) => r.conclusion === 'failure' || r.conclusion === 'timed_out'
    ).length;

    const failureRate = totalRuns > 0 ? (failedRuns / totalRuns) * 100 : 0;

    // Calculate consecutive failures (from most recent)
    let consecutiveFailures = 0;
    for (const run of runs) {
      if (run.conclusion === 'failure' || run.conclusion === 'timed_out') {
        consecutiveFailures++;
      } else if (run.conclusion === 'success') {
        break;
      }
    }

    // Find last successful run
    const lastSuccessfulRun =
      runs.find((r) => r.conclusion === 'success') || null;

    // Determine if should disable
    const disableReasons: string[] = [];
    let shouldDisable = false;

    // Check if workflow is safelisted
    const workflowFileName = workflow.path.split('/').pop() || '';
    if (this.config.safelistWorkflows.includes(workflowFileName)) {
      shouldDisable = false;
    } else {
      if (
        consecutiveFailures >= this.config.failureThreshold &&
        totalRuns >= this.config.failureThreshold
      ) {
        disableReasons.push(
          `${consecutiveFailures} consecutive failures (threshold: ${this.config.failureThreshold})`
        );
        shouldDisable = true;
      }

      if (
        failureRate >= this.config.failureRateThreshold &&
        totalRuns >= 5
      ) {
        disableReasons.push(
          `${failureRate.toFixed(1)}% failure rate (threshold: ${this.config.failureRateThreshold}%)`
        );
        shouldDisable = true;
      }

      if (totalRuns > 0 && successfulRuns === 0) {
        disableReasons.push('No successful runs');
        shouldDisable = true;
      }
    }

    // Check for known issues
    const issues = await this.checkWorkflowIssues(repo, workflow.path);

    // Get last 10 runs for report
    const lastRuns = runs.slice(0, 10);

    return {
      repository: repo,
      workflowName: workflow.name,
      workflowPath: workflow.path,
      workflowId: workflow.id,
      totalRuns,
      successfulRuns,
      failedRuns,
      failureRate,
      consecutiveFailures,
      lastRuns,
      lastSuccessfulRun,
      shouldDisable,
      disableReason: disableReasons,
      issues,
    };
  }

  private async checkWorkflowIssues(
    repo: string,
    workflowPath: string
  ): Promise<string[]> {
    const issues: string[] = [];
    const content = await this.client.getWorkflowContent(repo, workflowPath);

    if (!content) {
      return issues;
    }

    try {
      const workflowConfig = yaml.load(content) as any;

      // Check for duplicate install commands (known issue in index/ci.yml)
      if (repo === 'index' && workflowPath.includes('ci.yml')) {
        const contentLines = content.split('\n');
        let npmCiCount = 0;
        let npmInstallCount = 0;

        for (const line of contentLines) {
          if (line.includes('npm ci')) npmCiCount++;
          if (line.includes('npm install')) npmInstallCount++;
        }

        if (npmCiCount > 0 && npmInstallCount > 0) {
          issues.push(
            'Duplicate install commands: both "npm ci" and "npm install" found'
          );
        }
      }

      // Check for high-frequency cron jobs
      if (workflowConfig.on?.schedule) {
        const schedules = Array.isArray(workflowConfig.on.schedule)
          ? workflowConfig.on.schedule
          : [workflowConfig.on.schedule];

        for (const schedule of schedules) {
          if (schedule.cron) {
            const cronParts = schedule.cron.split(' ');
            // Check if runs hourly or more frequently
            if (cronParts[0] === '*' || cronParts[0].includes(',')) {
              issues.push(
                `High-frequency cron schedule: "${schedule.cron}" may run too frequently`
              );
            }
          }
        }
      }

      // Check for multiple deployment workflows (Real_Estate_Intelligence issue)
      if (repo === 'Real_Estate_Intelligence') {
        const fileName = workflowPath.split('/').pop() || '';
        if (
          fileName.includes('deploy') &&
          workflowConfig.on?.push?.branches?.includes('main')
        ) {
          issues.push(
            'Multiple deployment workflows detected - may cause conflicts'
          );
        }
      }
    } catch (error: any) {
      console.error(
        `Error parsing YAML workflow ${repo}:${workflowPath}:`,
        error.message,
        '\nThe workflow file may have syntax errors. Validate it at https://www.yamllint.com/'
      );
    }

    return issues;
  }
}
