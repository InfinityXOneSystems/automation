import fs from 'fs-extra';
import { markdownTable } from 'markdown-table';
import { AnalysisReport, WorkflowAnalysis } from './types.js';

export class ReportGenerator {
  async generateJsonReport(
    report: AnalysisReport,
    outputPath: string = 'workflow-analysis-report.json'
  ): Promise<void> {
    await fs.writeJson(outputPath, report, { spaces: 2 });
    console.log(`JSON report generated: ${outputPath}`);
  }

  async generateMarkdownReport(
    report: AnalysisReport,
    outputPath: string = 'workflow-analysis-report.md'
  ): Promise<void> {
    let markdown = '# GitHub Actions Workflow Analysis Report\n\n';

    // Summary section
    markdown += '## Executive Summary\n\n';
    markdown += `- **Analysis Date**: ${new Date(report.timestamp).toLocaleString()}\n`;
    markdown += `- **Organization**: ${report.organization}\n`;
    markdown += `- **Repositories Analyzed**: ${report.totalRepositories}\n`;
    markdown += `- **Total Workflows**: ${report.totalWorkflows}\n`;
    markdown += `- **Failing Workflows**: ${report.failingWorkflows}\n`;
    markdown += `- **Overall Success Rate**: ${report.successRate}%\n`;
    markdown += `- **Total Workflow Runs (last 7 days)**: ${report.summary.totalRuns}\n`;
    markdown += `- **Successful Runs**: ${report.summary.successfulRuns}\n`;
    markdown += `- **Failed Runs**: ${report.summary.failedRuns}\n\n`;

    // Recommendations
    if (report.failingWorkflows > 0) {
      markdown += '## Recommendations\n\n';
      markdown += `Found ${report.failingWorkflows} failing workflows that should be disabled to reduce excessive workflow runs.\n\n`;
      markdown += '**Action Required**: Run `npm run disable --confirm` to disable failing workflows.\n\n';
    } else {
      markdown += '## Status\n\n';
      markdown += '✅ All workflows are functioning properly. No action required.\n\n';
    }

    // Repository breakdown
    markdown += '## Repository Breakdown\n\n';

    const repoTableData: string[][] = [
      ['Repository', 'Total Workflows', 'Failing', 'Status'],
    ];

    for (const repo of report.repositories) {
      const status =
        repo.failingWorkflows === 0 ? '✅ Healthy' : '⚠️ Issues Found';
      repoTableData.push([
        repo.repository,
        repo.totalWorkflows.toString(),
        repo.failingWorkflows.toString(),
        status,
      ]);
    }

    markdown += markdownTable(repoTableData) + '\n\n';

    // Failing workflows details
    const failingWorkflows: WorkflowAnalysis[] = [];
    for (const repo of report.repositories) {
      failingWorkflows.push(...repo.workflows.filter((w) => w.shouldDisable));
    }

    if (failingWorkflows.length > 0) {
      markdown += '## Failing Workflows Detail\n\n';

      for (const workflow of failingWorkflows) {
        markdown += `### ${workflow.repository} - ${workflow.workflowName}\n\n`;
        markdown += `- **Path**: \`${workflow.workflowPath}\`\n`;
        markdown += `- **Total Runs**: ${workflow.totalRuns}\n`;
        markdown += `- **Success Rate**: ${((workflow.successfulRuns / workflow.totalRuns) * 100).toFixed(1)}%\n`;
        markdown += `- **Failure Rate**: ${workflow.failureRate.toFixed(1)}%\n`;
        markdown += `- **Consecutive Failures**: ${workflow.consecutiveFailures}\n`;

        if (workflow.lastSuccessfulRun) {
          markdown += `- **Last Successful Run**: ${new Date(workflow.lastSuccessfulRun.created_at).toLocaleString()}\n`;
        } else {
          markdown += `- **Last Successful Run**: Never\n`;
        }

        markdown += '\n**Reasons for Disabling**:\n';
        for (const reason of workflow.disableReason) {
          markdown += `- ${reason}\n`;
        }

        if (workflow.issues.length > 0) {
          markdown += '\n**Known Issues**:\n';
          for (const issue of workflow.issues) {
            markdown += `- ${issue}\n`;
          }
        }

        // Last 5 runs
        if (workflow.lastRuns.length > 0) {
          markdown += '\n**Recent Runs**:\n\n';
          const runsTable: string[][] = [
            ['Run #', 'Status', 'Conclusion', 'Date'],
          ];

          for (const run of workflow.lastRuns.slice(0, 5)) {
            const status = this.getStatusEmoji(run.conclusion);
            runsTable.push([
              run.run_number.toString(),
              status,
              run.conclusion || run.status || 'pending',
              new Date(run.created_at).toLocaleDateString(),
            ]);
          }

          markdown += markdownTable(runsTable) + '\n';
        }

        markdown += '\n---\n\n';
      }
    }

    // Healthy workflows summary
    const healthyRepos = report.repositories.filter(
      (r) => r.failingWorkflows === 0 && r.totalWorkflows > 0
    );

    if (healthyRepos.length > 0) {
      markdown += '## Healthy Repositories\n\n';
      markdown +=
        'The following repositories have all workflows functioning properly:\n\n';

      for (const repo of healthyRepos) {
        markdown += `- **${repo.repository}**: ${repo.totalWorkflows} workflow(s)\n`;
      }

      markdown += '\n';
    }

    // Known issues across organization
    const allIssues: { repo: string; workflow: string; issues: string[] }[] =
      [];
    for (const repo of report.repositories) {
      for (const workflow of repo.workflows) {
        if (workflow.issues.length > 0) {
          allIssues.push({
            repo: repo.repository,
            workflow: workflow.workflowName,
            issues: workflow.issues,
          });
        }
      }
    }

    if (allIssues.length > 0) {
      markdown += '## Known Configuration Issues\n\n';
      markdown +=
        'These workflows have configuration issues that should be fixed:\n\n';

      for (const item of allIssues) {
        markdown += `### ${item.repo} - ${item.workflow}\n\n`;
        for (const issue of item.issues) {
          markdown += `- ${issue}\n`;
        }
        markdown += '\n';
      }
    }

    await fs.writeFile(outputPath, markdown);
    console.log(`Markdown report generated: ${outputPath}`);
  }

  private getStatusEmoji(conclusion: string | null): string {
    switch (conclusion) {
      case 'success':
        return '✅';
      case 'failure':
        return '❌';
      case 'timed_out':
        return '⏱️';
      case 'cancelled':
        return '🚫';
      case 'skipped':
        return '⏭️';
      default:
        return '⏳';
    }
  }
}
