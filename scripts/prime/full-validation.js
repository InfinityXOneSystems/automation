#!/usr/bin/env node
/**
 * Full Validation - Runs complete validation pipeline
 * Pipeline: Lint → Typecheck → Tests → Contract → Build → Smoke
 *
 * Outputs comprehensive validation report
 */
import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
class FullValidation {
    steps = [];
    startTime = 0;
    outputDir;
    constructor() {
        this.outputDir = join(process.cwd(), 'docs', 'system');
        this.initializeSteps();
    }
    /**
     * Initialize validation steps
     */
    initializeSteps() {
        this.steps = [
            { name: 'Lint', command: 'npm run lint', status: 'pending' },
            { name: 'Typecheck', command: 'npm run typecheck', status: 'pending' },
            { name: 'Tests', command: 'npm test', status: 'pending' },
            { name: 'Contract Check', status: 'pending' },
            { name: 'Build', command: 'npm run build', status: 'pending' },
            { name: 'Smoke Tests', command: 'npm run smoke', status: 'pending' }
        ];
    }
    /**
     * Run all validation steps
     */
    async runValidation() {
        this.startTime = Date.now();
        console.log('🔍 Running Full Validation Pipeline\n');
        for (const step of this.steps) {
            await this.runStep(step);
        }
        const duration = Date.now() - this.startTime;
        const summary = this.calculateSummary();
        const success = summary.failed === 0;
        const report = {
            timestamp: new Date().toISOString(),
            duration,
            success,
            steps: this.steps,
            summary
        };
        await this.generateReport(report);
        return report;
    }
    /**
     * Run a single validation step
     */
    async runStep(step) {
        const stepStart = Date.now();
        step.status = 'running';
        console.log(`▶️  ${step.name}...`);
        try {
            if (step.name === 'Contract Check') {
                // Special handling for contract check
                await this.runContractCheck(step);
            }
            else if (step.command) {
                // Check if the command exists in package.json
                const hasCommand = this.checkCommandExists(step.command);
                if (!hasCommand) {
                    step.status = 'skipped';
                    step.output = 'Command not found in package.json';
                    console.log(`   ⏭️  Skipped (command not available)\n`);
                    return;
                }
                const output = execSync(step.command, {
                    cwd: process.cwd(),
                    encoding: 'utf-8',
                    stdio: 'pipe'
                });
                step.output = output;
                step.status = 'passed';
                step.duration = Date.now() - stepStart;
                console.log(`   ✅ Passed (${step.duration}ms)\n`);
            }
        }
        catch (error) {
            step.status = 'failed';
            step.duration = Date.now() - stepStart;
            step.error = error instanceof Error ? error.message : String(error);
            console.log(`   ❌ Failed (${step.duration}ms)\n`);
        }
    }
    /**
     * Check if command exists in package.json scripts
     */
    checkCommandExists(command) {
        try {
            const packageJson = require(join(process.cwd(), 'package.json'));
            const scriptName = command.replace('npm run ', '').replace('npm ', '');
            // Check if it's a built-in npm command or exists in scripts
            const builtInCommands = ['test', 'start', 'build'];
            return builtInCommands.includes(scriptName) || !!packageJson.scripts?.[scriptName];
        }
        catch {
            return false;
        }
    }
    /**
     * Run contract check
     */
    async runContractCheck(step) {
        const contractPath = join(process.cwd(), 'automation_contract', 'contract_version.json');
        if (!existsSync(contractPath)) {
            step.status = 'failed';
            step.error = 'Contract file not found';
            console.log(`   ❌ Failed - Contract file not found\n`);
            return;
        }
        try {
            const contract = require(contractPath);
            // Validate contract structure
            if (!contract.version || !contract.tiers) {
                throw new Error('Invalid contract structure');
            }
            step.status = 'passed';
            step.output = `Contract version ${contract.version} validated`;
            console.log(`   ✅ Passed - Contract v${contract.version}\n`);
        }
        catch (error) {
            step.status = 'failed';
            step.error = error instanceof Error ? error.message : String(error);
            console.log(`   ❌ Failed - ${step.error}\n`);
        }
    }
    /**
     * Calculate summary statistics
     */
    calculateSummary() {
        return {
            total: this.steps.length,
            passed: this.steps.filter(s => s.status === 'passed').length,
            failed: this.steps.filter(s => s.status === 'failed').length,
            skipped: this.steps.filter(s => s.status === 'skipped').length
        };
    }
    /**
     * Generate validation report
     */
    async generateReport(report) {
        // Generate JSON report
        const jsonPath = join(this.outputDir, 'FINAL_VALIDATION_REPORT.json');
        writeFileSync(jsonPath, JSON.stringify(report, null, 2));
        // Generate Markdown report
        const mdReport = this.generateMarkdownReport(report);
        const mdPath = join(this.outputDir, 'FINAL_VALIDATION_REPORT.md');
        writeFileSync(mdPath, mdReport);
        console.log(`\n📊 Validation Report Generated`);
        console.log(`   Status: ${report.success ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Duration: ${report.duration}ms`);
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   Markdown: ${mdPath}\n`);
    }
    /**
     * Generate markdown report
     */
    generateMarkdownReport(report) {
        const statusEmoji = {
            passed: '✅',
            failed: '❌',
            skipped: '⏭️',
            pending: '⏸️',
            running: '▶️'
        };
        return `# Full Validation Report

**Status:** ${report.success ? '✅ PASSED' : '❌ FAILED'}  
**Generated:** ${report.timestamp}  
**Duration:** ${report.duration}ms

---

## Summary

| Metric | Count |
|--------|-------|
| Total Steps | ${report.summary.total} |
| Passed | ✅ ${report.summary.passed} |
| Failed | ❌ ${report.summary.failed} |
| Skipped | ⏭️ ${report.summary.skipped} |

---

## Steps

| Step | Status | Duration | Details |
|------|--------|----------|---------|
${report.steps.map(s => {
            const status = statusEmoji[s.status] + ' ' + s.status.toUpperCase();
            const duration = s.duration ? `${s.duration}ms` : '-';
            const details = s.error || s.output || '-';
            return `| ${s.name} | ${status} | ${duration} | ${details.split('\n')[0].substring(0, 50)}... |`;
        }).join('\n')}

---

## Detailed Results

${report.steps.map(s => `### ${s.name}

**Status:** ${statusEmoji[s.status]} ${s.status.toUpperCase()}  
**Duration:** ${s.duration || 0}ms  
**Command:** ${s.command || 'N/A'}

${s.error ? `**Error:**\n\`\`\`\n${s.error}\n\`\`\`` : ''}
${s.output ? `**Output:**\n\`\`\`\n${s.output.substring(0, 500)}${s.output.length > 500 ? '...' : ''}\n\`\`\`` : ''}

---
`).join('\n')}

## Next Steps

${report.success
            ? '✅ All validation steps passed. Safe to proceed with deployment.'
            : '❌ Validation failed. Please fix the failing steps before proceeding.'}

${!report.success ? `

### Failed Steps

${report.steps.filter(s => s.status === 'failed').map(s => `- **${s.name}**: ${s.error}`).join('\n')}

` : ''}
`;
    }
}
// Main execution
async function main() {
    try {
        const validation = new FullValidation();
        const report = await validation.runValidation();
        // Exit with appropriate code
        process.exit(report.success ? 0 : 1);
    }
    catch (error) {
        console.error('❌ Fatal Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=full-validation.js.map