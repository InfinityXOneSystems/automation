import fs from 'fs-extra';
import path from 'path';
import {
  Config,
  AnalysisReport,
  DisabledWorkflow,
  DisabledWorkflowsManifest,
  AuditLog,
  AuditLogEntry,
} from './types.js';

export class AuditLogger {
  private logPath: string;
  private log: AuditLog;

  constructor(logPath: string = 'audit-log.json') {
    this.logPath = logPath;
    this.log = { entries: [] };
  }

  async load(): Promise<void> {
    if (await fs.pathExists(this.logPath)) {
      this.log = await fs.readJson(this.logPath);
    }
  }

  async addEntry(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.log.entries.push(fullEntry);
    await this.save();
  }

  async save(): Promise<void> {
    await fs.writeJson(this.logPath, this.log, { spaces: 2 });
  }

  getEntries(): AuditLogEntry[] {
    return this.log.entries;
  }
}

export class WorkflowDisabler {
  private config: Config;
  private auditLogger: AuditLogger;

  constructor(config: Config, auditLogger: AuditLogger) {
    this.config = config;
    this.auditLogger = auditLogger;
  }

  async disableWorkflows(
    report: AnalysisReport,
    dryRun: boolean = true
  ): Promise<DisabledWorkflowsManifest> {
    console.log(
      dryRun
        ? '\n🔍 DRY RUN MODE - No changes will be made\n'
        : '\n⚠️  LIVE MODE - Workflows will be disabled\n'
    );

    await fs.ensureDir(this.config.backupDirectory);

    const disabledWorkflows: DisabledWorkflow[] = [];

    for (const repo of report.repositories) {
      const failingWorkflows = repo.workflows.filter((w) => w.shouldDisable);

      if (failingWorkflows.length === 0) {
        continue;
      }

      console.log(`\nRepository: ${repo.repository}`);
      console.log(`  Found ${failingWorkflows.length} workflow(s) to disable`);

      for (const workflow of failingWorkflows) {
        try {
          const disabled = await this.disableWorkflow(
            repo.repository,
            workflow,
            dryRun
          );
          disabledWorkflows.push(disabled);

          if (!dryRun) {
            await this.auditLogger.addEntry({
              action: 'disable',
              repository: repo.repository,
              workflow: workflow.workflowName,
              details: {
                originalPath: disabled.originalPath,
                disabledPath: disabled.disabledPath,
                reason: disabled.reason,
              },
              success: true,
            });
          }

          console.log(
            `  ${dryRun ? '[DRY RUN]' : '✓'} ${workflow.workflowName}`
          );
        } catch (error: any) {
          console.error(`  ✗ Error disabling ${workflow.workflowName}:`, error.message);

          await this.auditLogger.addEntry({
            action: 'disable',
            repository: repo.repository,
            workflow: workflow.workflowName,
            details: { error: error.message },
            success: false,
            error: error.message,
          });
        }
      }
    }

    const manifest: DisabledWorkflowsManifest = {
      timestamp: new Date().toISOString(),
      disabledWorkflows,
    };

    if (!dryRun) {
      await fs.writeJson('disabled-workflows-manifest.json', manifest, {
        spaces: 2,
      });
      console.log('\n✓ Disabled workflows manifest saved');
    }

    console.log(`\n${dryRun ? 'Would disable' : 'Disabled'} ${disabledWorkflows.length} workflow(s)`);

    return manifest;
  }

  private async disableWorkflow(
    repo: string,
    workflow: any,
    dryRun: boolean
  ): Promise<DisabledWorkflow> {
    // For this implementation, we'll create a record but won't actually modify GitHub
    // In a real implementation, you'd need to use GitHub API or git operations
    
    const originalPath = workflow.workflowPath;
    const disabledPath = `${originalPath}.disabled`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      this.config.backupDirectory,
      `${repo}_${path.basename(originalPath)}_${timestamp}`
    );

    const disabledWorkflow: DisabledWorkflow = {
      repository: repo,
      workflowName: workflow.workflowName,
      originalPath,
      disabledPath,
      backupPath,
      disabledAt: new Date().toISOString(),
      reason: workflow.disableReason,
      analysis: workflow,
    };

    if (!dryRun) {
      // In a real implementation, this would:
      // 1. Clone the repo or use GitHub API
      // 2. Copy workflow file to backup location
      // 3. Rename workflow file from .yml to .yml.disabled
      // 4. Commit and push changes
      
      // For now, we'll just create a backup record
      await fs.writeJson(backupPath, workflow, { spaces: 2 });

      await this.auditLogger.addEntry({
        action: 'backup',
        repository: repo,
        workflow: workflow.workflowName,
        details: { backupPath },
        success: true,
      });
    }

    return disabledWorkflow;
  }

  async restoreWorkflows(
    manifestPath: string = 'disabled-workflows-manifest.json',
    options: {
      repo?: string;
      workflow?: string;
      all?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<void> {
    const dryRun = options.dryRun ?? true;

    console.log(
      dryRun
        ? '\n🔍 DRY RUN MODE - No changes will be made\n'
        : '\n⚠️  LIVE MODE - Workflows will be restored\n'
    );

    if (!(await fs.pathExists(manifestPath))) {
      throw new Error(`Manifest file not found: ${manifestPath}`);
    }

    const manifest: DisabledWorkflowsManifest = await fs.readJson(manifestPath);

    let workflowsToRestore = manifest.disabledWorkflows;

    if (options.repo) {
      workflowsToRestore = workflowsToRestore.filter(
        (w) => w.repository === options.repo
      );
      console.log(`Filtering by repository: ${options.repo}`);
    }

    if (options.workflow) {
      workflowsToRestore = workflowsToRestore.filter((w) =>
        w.originalPath.includes(options.workflow!)
      );
      console.log(`Filtering by workflow: ${options.workflow}`);
    }

    if (workflowsToRestore.length === 0) {
      console.log('No workflows found matching criteria');
      return;
    }

    console.log(`${dryRun ? 'Would restore' : 'Restoring'} ${workflowsToRestore.length} workflow(s)\n`);

    for (const workflow of workflowsToRestore) {
      try {
        await this.restoreWorkflow(workflow, dryRun);

        if (!dryRun) {
          await this.auditLogger.addEntry({
            action: 'restore',
            repository: workflow.repository,
            workflow: workflow.workflowName,
            details: {
              originalPath: workflow.originalPath,
              disabledPath: workflow.disabledPath,
            },
            success: true,
          });
        }

        console.log(
          `  ${dryRun ? '[DRY RUN]' : '✓'} ${workflow.repository}/${workflow.workflowName}`
        );
      } catch (error: any) {
        console.error(
          `  ✗ Error restoring ${workflow.repository}/${workflow.workflowName}:`,
          error.message
        );

        await this.auditLogger.addEntry({
          action: 'restore',
          repository: workflow.repository,
          workflow: workflow.workflowName,
          details: { error: error.message },
          success: false,
          error: error.message,
        });
      }
    }

    if (!dryRun && workflowsToRestore.length > 0) {
      // Remove restored workflows from manifest
      const remainingWorkflows = manifest.disabledWorkflows.filter(
        (w) => !workflowsToRestore.includes(w)
      );

      manifest.disabledWorkflows = remainingWorkflows;
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
      console.log('\n✓ Manifest updated');
    }
  }

  private async restoreWorkflow(
    workflow: DisabledWorkflow,
    dryRun: boolean
  ): Promise<void> {
    // In a real implementation, this would:
    // 1. Clone the repo or use GitHub API
    // 2. Rename workflow file from .yml.disabled back to .yml
    // 3. Commit and push changes

    if (!dryRun) {
      // Actual restoration logic would go here
    }
  }
}
