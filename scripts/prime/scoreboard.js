#!/usr/bin/env node
/**
 * Scoreboard - Tracks metrics across all repositories
 *
 * Metrics: Reliability, Correctness, Consistency, Safety
 * Outputs: docs/system/SCOREBOARD.{md,json}
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
class ScoreboardGenerator {
    outputDir;
    constructor() {
        this.outputDir = join(process.cwd(), 'docs', 'system');
    }
    /**
     * Generate scoreboard
     */
    async generate() {
        console.log('📊 Generating Scoreboard\n');
        // In production, this would fetch real metrics from all repos
        // For now, create example data
        const repositories = this.getExampleMetrics();
        const totalRepos = repositories.length;
        const averageScore = repositories.reduce((sum, r) => sum + r.overall, 0) / totalRepos;
        const sorted = [...repositories].sort((a, b) => b.overall - a.overall);
        const topPerformers = sorted.slice(0, 5).map(r => r.repo);
        const needsAttention = sorted.filter(r => r.overall < 70).map(r => r.repo);
        const scoreboard = {
            timestamp: new Date().toISOString(),
            totalRepos,
            averageScore,
            repositories,
            topPerformers,
            needsAttention
        };
        await this.saveScoreboard(scoreboard);
        return scoreboard;
    }
    /**
     * Get example metrics (in production, fetch from repos)
     */
    getExampleMetrics() {
        return [
            {
                repo: 'automation',
                reliability: 95,
                correctness: 90,
                consistency: 85,
                safety: 100,
                overall: 92.5,
                lastUpdated: new Date().toISOString()
            },
            {
                repo: 'foundation',
                reliability: 88,
                correctness: 92,
                consistency: 90,
                safety: 95,
                overall: 91.25,
                lastUpdated: new Date().toISOString()
            },
            {
                repo: 'taxonomy',
                reliability: 75,
                correctness: 80,
                consistency: 70,
                safety: 85,
                overall: 77.5,
                lastUpdated: new Date().toISOString()
            }
        ];
    }
    /**
     * Save scoreboard
     */
    async saveScoreboard(scoreboard) {
        // Save JSON
        const jsonPath = join(this.outputDir, 'SCOREBOARD.json');
        writeFileSync(jsonPath, JSON.stringify(scoreboard, null, 2));
        // Save Markdown
        const mdPath = join(this.outputDir, 'SCOREBOARD.md');
        const markdown = this.generateMarkdown(scoreboard);
        writeFileSync(mdPath, markdown);
        console.log(`✅ Scoreboard Generated`);
        console.log(`   Total Repos: ${scoreboard.totalRepos}`);
        console.log(`   Average Score: ${scoreboard.averageScore.toFixed(2)}`);
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   Markdown: ${mdPath}\n`);
    }
    /**
     * Generate markdown report
     */
    generateMarkdown(scoreboard) {
        return `# Infinity Prime Scoreboard

**Generated:** ${scoreboard.timestamp}  
**Total Repositories:** ${scoreboard.totalRepos}  
**Average Score:** ${scoreboard.averageScore.toFixed(2)}

---

## Repository Metrics

| Repo | Reliability | Correctness | Consistency | Safety | Overall | Status |
|------|-------------|-------------|-------------|--------|---------|--------|
${scoreboard.repositories
            .sort((a, b) => b.overall - a.overall)
            .map(r => {
            const status = r.overall >= 90 ? '🟢 Excellent' : r.overall >= 80 ? '🟡 Good' : r.overall >= 70 ? '🟠 Fair' : '🔴 Needs Work';
            return `| ${r.repo} | ${r.reliability}% | ${r.correctness}% | ${r.consistency}% | ${r.safety}% | **${r.overall.toFixed(1)}%** | ${status} |`;
        }).join('\n')}

---

## Top Performers 🏆

${scoreboard.topPerformers.map((repo, i) => `${i + 1}. **${repo}**`).join('\n')}

---

## Needs Attention ⚠️

${scoreboard.needsAttention.length > 0
            ? scoreboard.needsAttention.map(repo => `- **${repo}** (score < 70%)`).join('\n')
            : '_All repositories performing well!_'}

---

## Metrics Explained

- **Reliability**: Uptime, workflow success rate, deployment stability
- **Correctness**: Test coverage, bug count, code quality
- **Consistency**: Code style adherence, documentation completeness
- **Safety**: Security vulnerabilities, compliance, audit logs

---

_Updated: ${scoreboard.timestamp}_
`;
    }
}
// Main execution
async function main() {
    try {
        const generator = new ScoreboardGenerator();
        await generator.generate();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=scoreboard.js.map