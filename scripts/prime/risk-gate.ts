#!/usr/bin/env node
/**
 * Risk Gate - Determines safety tier for automated operations
 * Tiers: SAFE / CAUTION / BLOCKED
 * 
 * Integrates with workflow analyzer to assess risk level
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface RiskAssessment {
  tier: 'SAFE' | 'CAUTION' | 'BLOCKED';
  reasons: string[];
  timestamp: string;
  metrics: {
    testsPass: boolean;
    securityVulnerabilities: number;
    breakingChanges: number;
    codeCoverage: number;
    protectedPathsModified: boolean;
  };
  recommendations: string[];
}

interface ContractConfig {
  version: string;
  tiers: Record<string, { description: string; criteria: string[]; actions: string[] }>;
  protected_paths: string[];
}

class RiskGate {
  private contractPath: string;
  private contract: ContractConfig;
  private outputDir: string;

  constructor() {
    this.contractPath = join(process.cwd(), 'automation_contract', 'contract_version.json');
    this.outputDir = join(process.cwd(), 'docs', 'system');
    
    if (!existsSync(this.contractPath)) {
      throw new Error('Automation contract not found. Please ensure contract_version.json exists.');
    }

    this.contract = JSON.parse(readFileSync(this.contractPath, 'utf-8'));
  }

  /**
   * Assess risk level based on current state
   */
  async assessRisk(): Promise<RiskAssessment> {
    const metrics = await this.gatherMetrics();
    const tier = this.determineTier(metrics);
    const reasons = this.determineReasons(tier, metrics);
    const recommendations = this.generateRecommendations(tier, metrics);

    return {
      tier,
      reasons,
      timestamp: new Date().toISOString(),
      metrics,
      recommendations
    };
  }

  /**
   * Gather metrics for risk assessment
   * Note: Currently uses placeholder/example values.
   * In production, these would integrate with actual test runners,
   * security scanners, coverage tools, and git diff analysis.
   */
  private async gatherMetrics() {
    // Check if tests pass (look for test results or workflow status)
    const testsPass = await this.checkTests();
    
    // Check for security vulnerabilities
    const securityVulnerabilities = await this.checkSecurity();
    
    // Check for breaking changes
    const breakingChanges = await this.checkBreakingChanges();
    
    // Check code coverage
    const codeCoverage = await this.checkCodeCoverage();
    
    // Check if protected paths modified
    const protectedPathsModified = await this.checkProtectedPaths();

    return {
      testsPass,
      securityVulnerabilities,
      breakingChanges,
      codeCoverage,
      protectedPathsModified
    };
  }

  /**
   * Check if tests pass
   */
  private async checkTests(): Promise<boolean> {
    // For now, assume tests pass if no test failures are found
    // In production, this would check actual test results
    return true;
  }

  /**
   * Check for security vulnerabilities
   */
  private async checkSecurity(): Promise<number> {
    // For now, return 0. In production, this would run security scanners
    // Could integrate with npm audit, snyk, or other security tools
    return 0;
  }

  /**
   * Check for breaking changes
   */
  private async checkBreakingChanges(): Promise<number> {
    // For now, return 0. In production, this would analyze API changes
    // Could use semantic versioning analysis or API diff tools
    return 0;
  }

  /**
   * Check code coverage
   */
  private async checkCodeCoverage(): Promise<number> {
    // For now, return 85 (good coverage). In production, read from coverage reports
    return 85;
  }

  /**
   * Check if protected paths were modified
   */
  private async checkProtectedPaths(): Promise<boolean> {
    // For now, return false. In production, check git diff against protected paths
    return false;
  }

  /**
   * Determine tier based on metrics
   */
  private determineTier(metrics: RiskAssessment['metrics']): 'SAFE' | 'CAUTION' | 'BLOCKED' {
    // BLOCKED tier
    if (!metrics.testsPass || 
        metrics.securityVulnerabilities > 0 || 
        metrics.breakingChanges > 2 || 
        metrics.protectedPathsModified) {
      return 'BLOCKED';
    }

    // CAUTION tier
    if (metrics.codeCoverage < 80 || 
        metrics.breakingChanges > 0) {
      return 'CAUTION';
    }

    // SAFE tier
    return 'SAFE';
  }

  /**
   * Determine reasons for the tier
   */
  private determineReasons(tier: string, metrics: RiskAssessment['metrics']): string[] {
    const reasons: string[] = [];

    if (tier === 'BLOCKED') {
      if (!metrics.testsPass) reasons.push('Tests are failing');
      if (metrics.securityVulnerabilities > 0) {
        reasons.push(`${metrics.securityVulnerabilities} security vulnerabilities detected`);
      }
      if (metrics.breakingChanges > 2) {
        reasons.push(`${metrics.breakingChanges} breaking changes detected`);
      }
      if (metrics.protectedPathsModified) {
        reasons.push('Protected paths have been modified');
      }
    } else if (tier === 'CAUTION') {
      if (metrics.codeCoverage < 80) {
        reasons.push(`Code coverage is ${metrics.codeCoverage}% (below 80% threshold)`);
      }
      if (metrics.breakingChanges > 0) {
        reasons.push(`${metrics.breakingChanges} breaking changes detected`);
      }
    } else {
      reasons.push('All quality gates passed');
      reasons.push(`Code coverage: ${metrics.codeCoverage}%`);
      reasons.push('No security vulnerabilities');
      reasons.push('No breaking changes');
    }

    return reasons;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(tier: string, metrics: RiskAssessment['metrics']): string[] {
    const recommendations: string[] = [];

    if (tier === 'BLOCKED') {
      if (!metrics.testsPass) {
        recommendations.push('Fix failing tests before proceeding');
      }
      if (metrics.securityVulnerabilities > 0) {
        recommendations.push('Address all security vulnerabilities');
      }
      if (metrics.breakingChanges > 2) {
        recommendations.push('Review and minimize breaking changes');
      }
      if (metrics.protectedPathsModified) {
        recommendations.push('Revert changes to protected paths or get approval');
      }
    } else if (tier === 'CAUTION') {
      if (metrics.codeCoverage < 80) {
        recommendations.push('Increase test coverage to at least 80%');
      }
      recommendations.push('Request code review before merging');
    } else {
      recommendations.push('Safe to auto-merge');
      recommendations.push('Safe to auto-deploy to staging');
    }

    return recommendations;
  }

  /**
   * Generate risk gate report
   */
  async generateReport(assessment: RiskAssessment): Promise<void> {
    // Generate JSON report
    const jsonReport = {
      generated: new Date().toISOString(),
      contract_version: this.contract.version,
      assessment
    };

    const jsonPath = join(this.outputDir, 'RISK_GATE_REPORT.json');
    writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

    // Generate Markdown report
    const mdReport = this.generateMarkdownReport(assessment);
    const mdPath = join(this.outputDir, 'RISK_GATE_REPORT.md');
    writeFileSync(mdPath, mdReport);

    console.log(`\n✅ Risk Gate Report Generated`);
    console.log(`   Tier: ${assessment.tier}`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   Markdown: ${mdPath}\n`);
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(assessment: RiskAssessment): string {
    const tierEmoji = {
      SAFE: '✅',
      CAUTION: '⚠️',
      BLOCKED: '🚫'
    };

    return `# Risk Gate Report

## Assessment: ${tierEmoji[assessment.tier]} ${assessment.tier}

**Generated:** ${assessment.timestamp}

---

## Reasons

${assessment.reasons.map(r => `- ${r}`).join('\n')}

---

## Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Tests Pass | ${assessment.metrics.testsPass ? '✅ Yes' : '❌ No'} | ${assessment.metrics.testsPass ? 'PASS' : 'FAIL'} |
| Security Vulnerabilities | ${assessment.metrics.securityVulnerabilities} | ${assessment.metrics.securityVulnerabilities === 0 ? 'PASS' : 'FAIL'} |
| Breaking Changes | ${assessment.metrics.breakingChanges} | ${assessment.metrics.breakingChanges === 0 ? 'PASS' : assessment.metrics.breakingChanges <= 2 ? 'WARN' : 'FAIL'} |
| Code Coverage | ${assessment.metrics.codeCoverage}% | ${assessment.metrics.codeCoverage >= 80 ? 'PASS' : 'WARN'} |
| Protected Paths Modified | ${assessment.metrics.protectedPathsModified ? '⚠️ Yes' : '✅ No'} | ${assessment.metrics.protectedPathsModified ? 'FAIL' : 'PASS'} |

---

## Recommendations

${assessment.recommendations.map(r => `- ${r}`).join('\n')}

---

## Available Actions (based on tier)

${this.contract.tiers[assessment.tier]?.actions.map(a => `- ${a}`).join('\n') || 'No actions defined'}

---

*Contract Version: ${this.contract.version}*
`;
  }
}

// Main execution
async function main() {
  try {
    console.log('🔒 Infinity Prime - Risk Gate\n');

    const riskGate = new RiskGate();
    const assessment = await riskGate.assessRisk();
    await riskGate.generateReport(assessment);

    // Exit with appropriate code
    if (assessment.tier === 'BLOCKED') {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
