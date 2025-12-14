#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import { loadConfig, validateConfig } from './config.js';
import { WorkflowAnalyzer } from './analyzer.js';
import { ReportGenerator } from './report-generator.js';
import { WorkflowDisabler, AuditLogger } from './workflow-disabler.js';
import { AnalysisReport } from './types.js';

const program = new Command();

program
  .name('workflow-analyzer')
  .description('Analyze and manage GitHub Actions workflows')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze all workflows across repositories')
  .option('-c, --config <path>', 'Path to config file', 'config.json')
  .option('--json-only', 'Generate only JSON report')
  .option('--markdown-only', 'Generate only Markdown report')
  .action(async (options) => {
    try {
      console.log('Loading configuration...');
      const config = await loadConfig(options.config);
      validateConfig(config);

      const auditLogger = new AuditLogger();
      await auditLogger.load();

      console.log('\nStarting workflow analysis...\n');
      const analyzer = new WorkflowAnalyzer(config);
      const report = await analyzer.analyze();

      await auditLogger.addEntry({
        action: 'analyze',
        details: {
          totalRepositories: report.totalRepositories,
          totalWorkflows: report.totalWorkflows,
          failingWorkflows: report.failingWorkflows,
        },
        success: true,
      });

      console.log('\nGenerating reports...');
      const reportGenerator = new ReportGenerator();

      if (!options.markdownOnly) {
        await reportGenerator.generateJsonReport(report);
      }

      if (!options.jsonOnly) {
        await reportGenerator.generateMarkdownReport(report);
      }

      console.log('\n✓ Analysis complete!');
      console.log('\nSummary:');
      console.log(`  - Repositories: ${report.totalRepositories}`);
      console.log(`  - Total Workflows: ${report.totalWorkflows}`);
      console.log(`  - Failing Workflows: ${report.failingWorkflows}`);
      console.log(`  - Success Rate: ${report.successRate}%`);

      if (report.failingWorkflows > 0) {
        console.log('\n⚠️  Action Required:');
        console.log(
          '   Run "npm run disable --dry-run" to preview disabling failing workflows'
        );
        console.log(
          '   Run "npm run disable --confirm" to disable failing workflows'
        );
      }
    } catch (error: any) {
      console.error('Error during analysis:', error.message);
      process.exit(1);
    }
  });

program
  .command('disable')
  .description('Disable failing workflows')
  .option('-c, --config <path>', 'Path to config file', 'config.json')
  .option('--dry-run', 'Preview changes without making them (default)', true)
  .option('--confirm', 'Actually disable workflows (not dry-run)')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      validateConfig(config);

      const auditLogger = new AuditLogger();
      await auditLogger.load();

      // Load the analysis report
      const reportPath = 'workflow-analysis-report.json';
      if (!(await fs.pathExists(reportPath))) {
        console.error('Error: No analysis report found.');
        console.error('Please run "npm run analyze" first.');
        process.exit(1);
      }

      const report: AnalysisReport = await fs.readJson(reportPath);

      if (report.failingWorkflows === 0) {
        console.log('✓ No failing workflows to disable.');
        return;
      }

      const dryRun = !options.confirm;
      const disabler = new WorkflowDisabler(config, auditLogger);

      const manifest = await disabler.disableWorkflows(report, dryRun);

      if (dryRun) {
        console.log('\nℹ️  This was a dry run. No changes were made.');
        console.log(
          '   Run "npm run disable --confirm" to actually disable workflows.'
        );
      } else {
        console.log('\n✓ Workflows disabled successfully!');
        console.log('   Manifest saved to: disabled-workflows-manifest.json');
        console.log('   Use "npm run restore" to restore workflows if needed.');
      }
    } catch (error: any) {
      console.error('Error disabling workflows:', error.message);
      process.exit(1);
    }
  });

program
  .command('restore')
  .description('Restore disabled workflows')
  .option('-c, --config <path>', 'Path to config file', 'config.json')
  .option('-r, --repo <name>', 'Restore workflows for specific repository')
  .option('-w, --workflow <name>', 'Restore specific workflow')
  .option('--all', 'Restore all disabled workflows')
  .option('--dry-run', 'Preview changes without making them (default)', true)
  .option('--confirm', 'Actually restore workflows (not dry-run)')
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      validateConfig(config);

      const auditLogger = new AuditLogger();
      await auditLogger.load();

      const disabler = new WorkflowDisabler(config, auditLogger);

      const dryRun = !options.confirm;

      await disabler.restoreWorkflows('disabled-workflows-manifest.json', {
        repo: options.repo,
        workflow: options.workflow,
        all: options.all,
        dryRun,
      });

      if (dryRun) {
        console.log('\nℹ️  This was a dry run. No changes were made.');
        console.log(
          '   Run with --confirm to actually restore workflows.'
        );
      } else {
        console.log('\n✓ Workflows restored successfully!');
      }
    } catch (error: any) {
      console.error('Error restoring workflows:', error.message);
      process.exit(1);
    }
  });

program
  .command('report')
  .description('View the latest analysis report')
  .option('--json', 'Show JSON report')
  .option('--markdown', 'Show Markdown report (default)', true)
  .action(async (options) => {
    try {
      if (options.json) {
        const reportPath = 'workflow-analysis-report.json';
        if (!(await fs.pathExists(reportPath))) {
          console.error('Error: No analysis report found.');
          console.error('Please run "npm run analyze" first.');
          process.exit(1);
        }

        const report = await fs.readJson(reportPath);
        console.log(JSON.stringify(report, null, 2));
      } else {
        const reportPath = 'workflow-analysis-report.md';
        if (!(await fs.pathExists(reportPath))) {
          console.error('Error: No analysis report found.');
          console.error('Please run "npm run analyze" first.');
          process.exit(1);
        }

        const report = await fs.readFile(reportPath, 'utf-8');
        console.log(report);
      }
    } catch (error: any) {
      console.error('Error viewing report:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
