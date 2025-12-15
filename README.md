# Automation Templates Library

A centralized library for all automation templates and tools used across the organization.

## 🌟 Infinity Prime - Autonomous System Builder

This repository is the **command center** for Infinity Prime, our zero-human-approval autonomous system builder that manages 45+ repositories across the organization.

### Key Features

- 🤖 **Autonomous Operations** - Self-managing CI/CD with risk-based auto-merge
- 🔒 **Risk Gate System** - Three-tier safety system (SAFE/CAUTION/BLOCKED)
- 📊 **Workflow Analysis** - Automated detection and management of failing workflows
- 🏗️ **System Builder** - Multi-repo orchestration from industry templates
- 📈 **Continuous Monitoring** - Real-time metrics and scoreboard across all repos
- ✅ **Full Validation** - Complete pipeline: Lint → Typecheck → Tests → Build → Smoke

### Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run risk assessment
npm run prime:risk-gate

# Run full validation
npm run prime:validate

# View scoreboard
npm run prime:scoreboard

# Analyze workflows across org
npm run analyze
```

## Overview

This repository serves as:
- **Automation Templates Library** - Shared templates for CI/CD, IaC, deployment, and testing
- **Workflow Analysis Tools** - Tools to analyze and manage GitHub Actions workflows across all repositories
- **Infinity Prime Command Center** - Autonomous system builder for the organization

This repository integrates with:

- **[/foundation](https://github.com/InfinityXOneSystems/foundation)** - Core infrastructure and foundational components
- **[codex](https://github.com/InfinityXOneSystems/codex)** - Knowledge base and documentation repository

---

## 🚀 Infinity Prime Modules

### Core Automation Modules

#### 1. Risk Gate (`prime:risk-gate`)
Three-tier risk assessment system for autonomous operations.

- **SAFE**: Auto-merge, auto-deploy to staging
- **CAUTION**: Review required, can deploy to staging
- **BLOCKED**: Human intervention required

```bash
npm run prime:risk-gate
```

Outputs: `docs/system/RISK_GATE_REPORT.{md,json}`

#### 2. Full Validation (`prime:validate`)
Complete validation pipeline: Lint → Typecheck → Tests → Contract → Build → Smoke

```bash
npm run prime:validate
```

Outputs: `docs/system/FINAL_VALIDATION_REPORT.{md,json}`

#### 3. Scoreboard (`prime:scoreboard`)
Tracks metrics across all repositories: Reliability, Correctness, Consistency, Safety

```bash
npm run prime:scoreboard
```

Outputs: `docs/system/SCOREBOARD.{md,json}`

#### 4. Run Ledger (`prime:ledger`)
Append-only audit trail for all automation runs

```bash
npm run prime:ledger view
npm run prime:ledger add --module="validation" --action="test" --status="success"
```

Outputs: `docs/system/RUN_LEDGER.json`

#### 5. TODO Runner (`prime:todo`)
Executes bounded tasks from TODO.yaml (60min max, 3 cycles max)

```bash
npm run prime:todo              # Dry run
npm run prime:todo --execute    # Execute tasks
```

Outputs: `docs/system/TODO_STATUS.json`

### Multi-Repo Automation

#### 6. Create Repo (`prime:create-repo`)
Creates new repositories with Infinity Prime pre-configured

```bash
npm run prime:create-repo -- \
  --name="my-service" \
  --template="node-api" \
  --integrate-foundation \
  --integrate-codex
```

**Available Templates:**
- `node-api` - Express/Fastify API
- `python-api` - FastAPI server
- `react-spa` - Vite + React
- `next-app` - Next.js 14+
- `rust-service` - Actix/Axum
- `taxonomy` - AI model taxonomy

#### 7. Build System (`prime:build-system`)
Multi-repo orchestration from industry templates

```bash
npm run prime:build-system -- \
  --config=templates/industries/saas.yaml \
  --execute
```

**Industry Templates:**
- `saas.yaml` - Multi-tenant SaaS platform
- `healthcare.yaml` - HIPAA-compliant healthcare system
- `ecommerce.yaml` - PCI-DSS e-commerce platform
- `financial.yaml` - SOC2 financial services

### Dashboard

View the complete system dashboard:

```bash
cat docs/system/DASHBOARD.md
```

Or view online at: [Dashboard](./docs/system/DASHBOARD.md)

---

# GitHub Actions Workflow Analyzer

A comprehensive solution to analyze GitHub Actions workflows across all InfinityXOneSystems repositories, identify failing workflows, and automatically disable them to reduce excessive workflow runs.

## Features

- 🔍 **Automated Analysis**: Scans all repositories in the organization
- 📊 **Detailed Reports**: Generates both JSON and Markdown reports
- 🛡️ **Safety First**: Dry-run mode by default, with backups and audit logs
- 🔧 **Easy Restoration**: Simple commands to restore disabled workflows
- 📈 **Smart Detection**: Multiple failure criteria to identify problematic workflows
- ⚙️ **Configurable**: Customizable thresholds and exclusions

## Prerequisites

- Node.js 18+ or higher
- GitHub Personal Access Token with the following permissions:
  - `repo` - Full control of private repositories
  - `workflow` - Update GitHub Action workflows
  - `read:org` - Read organization data

## Installation

1. Clone the repository:
```bash
git clone https://github.com/InfinityXOneSystems/automation.git
cd automation
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Set up your GitHub token:
```bash
export GITHUB_TOKEN="your_personal_access_token_here"
```

## Quick Start

### 1. Analyze Workflows

Run a complete analysis of all workflows across the organization:

```bash
npm run analyze
```

This will:
- Scan all repositories in InfinityXOneSystems
- Check workflow run history for the last 7 days
- Identify failing workflows
- Generate reports in `workflow-analysis-report.json` and `workflow-analysis-report.md`

### 2. Preview Disabling (Dry Run)

Preview which workflows would be disabled without making changes:

```bash
npm run disable --dry-run
```

### 3. Disable Failing Workflows

Actually disable the failing workflows (requires confirmation):

```bash
npm run disable --confirm
```

This will:
- Create backups of workflow files
- Generate a restoration manifest
- Log all actions in the audit log

### 4. Restore Workflows

Restore all disabled workflows:

```bash
npm run restore --all --confirm
```

Restore workflows for a specific repository:

```bash
npm run restore --repo=index --confirm
```

Restore a specific workflow:

```bash
npm run restore --workflow=ci.yml --confirm
```

### 5. View Reports

View the latest Markdown report:

```bash
npm run report
```

View the JSON report:

```bash
npm run report --json
```

## Configuration

Configuration can be set in `config.json` or via environment variables.

### config.json

```json
{
  "failureThreshold": 3,
  "failureRateThreshold": 80,
  "timeWindowDays": 7,
  "excludeRepositories": [],
  "safelistWorkflows": [],
  "dryRun": true,
  "organization": "InfinityXOneSystems",
  "maxConcurrentRequests": 5,
  "backupDirectory": "workflow-backups"
}
```

### Configuration Options

| Option | Description | Default | Environment Variable |
|--------|-------------|---------|---------------------|
| `failureThreshold` | Number of consecutive failures to trigger disabling | 3 | `FAILURE_THRESHOLD` |
| `failureRateThreshold` | Failure rate percentage (0-100) to trigger disabling | 80 | `FAILURE_RATE_THRESHOLD` |
| `timeWindowDays` | Time window in days for analysis | 7 | `TIME_WINDOW_DAYS` |
| `excludeRepositories` | Array of repository names to exclude | `[]` | - |
| `safelistWorkflows` | Array of workflow filenames that should never be disabled | `[]` | - |
| `dryRun` | Whether to run in dry-run mode by default | `true` | - |
| `organization` | GitHub organization name | `InfinityXOneSystems` | `GITHUB_ORG` |
| `maxConcurrentRequests` | Maximum concurrent API requests | 5 | - |
| `backupDirectory` | Directory to store workflow backups | `workflow-backups` | - |

### Environment Variables

```bash
# Required
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# Optional
export GITHUB_ORG="InfinityXOneSystems"
export FAILURE_THRESHOLD="3"
export FAILURE_RATE_THRESHOLD="80"
export TIME_WINDOW_DAYS="7"
```

## Failure Detection Criteria

A workflow is marked for disabling if it meets ANY of the following criteria:

1. **Consecutive Failures**: Has failed in the last N consecutive runs (default: 3)
2. **High Failure Rate**: Has >N% failure rate in the time window (default: 80%)
3. **Never Succeeded**: Has runs but has never had a successful run

## Output Files

The tool generates the following files:

- `workflow-analysis-report.json` - Machine-readable analysis report
- `workflow-analysis-report.md` - Human-readable analysis report
- `disabled-workflows-manifest.json` - Manifest for restoring disabled workflows
- `workflow-backups/` - Directory containing backups of disabled workflows
- `audit-log.json` - Audit log of all actions taken

## CLI Commands

### analyze

Analyze all workflows across repositories.

```bash
npm run analyze [options]
```

Options:
- `-c, --config <path>` - Path to config file (default: `config.json`)
- `--json-only` - Generate only JSON report
- `--markdown-only` - Generate only Markdown report

### disable

Disable failing workflows.

```bash
npm run disable [options]
```

Options:
- `-c, --config <path>` - Path to config file (default: `config.json`)
- `--dry-run` - Preview changes without making them (default)
- `--confirm` - Actually disable workflows

### restore

Restore disabled workflows.

```bash
npm run restore [options]
```

Options:
- `-c, --config <path>` - Path to config file (default: `config.json`)
- `-r, --repo <name>` - Restore workflows for specific repository
- `-w, --workflow <name>` - Restore specific workflow
- `--all` - Restore all disabled workflows
- `--dry-run` - Preview changes without making them (default)
- `--confirm` - Actually restore workflows

### report

View the latest analysis report.

```bash
npm run report [options]
```

Options:
- `--json` - Show JSON report
- `--markdown` - Show Markdown report (default)

## Known Issues Addressed

The analyzer automatically detects and reports these known issues:

### index Repository
- **ci.yml**: Duplicate install commands (`npm ci` and `npm install` on line 29)

### Real_Estate_Intelligence Repository
- Multiple deployment workflows that may conflict:
  - `deploy-production.yml`
  - `deploy-cloud-run.yml`
  - `intelligence-cron.yml` (runs 4x daily)

### taxonomy Repository
- Auto-sync workflows running too frequently

## Safety Features

### 1. Dry-Run Mode
All potentially destructive operations default to dry-run mode. You must explicitly use `--confirm` to make actual changes.

### 2. Backups
Before disabling any workflow, a backup is created in the `workflow-backups/` directory.

### 3. Audit Log
All actions are logged in `audit-log.json` for accountability and debugging.

### 4. Restoration Manifest
A detailed manifest is created when workflows are disabled, making restoration easy.

### 5. Safelist
Workflows can be added to the safelist to prevent them from ever being disabled.

## Troubleshooting

### Error: "GitHub token is required"

**Solution**: Set the `GITHUB_TOKEN` environment variable:
```bash
export GITHUB_TOKEN="your_token_here"
```

### Error: "Organization not found or you don't have access"

**Solution**: Verify that:
1. Your token has the `read:org` permission
2. You have access to the organization
3. The organization name is correct in `config.json`

### Error: "Rate limit exceeded"

**Solution**: The GitHub API has rate limits. Wait for the rate limit to reset or:
1. Reduce `maxConcurrentRequests` in config
2. Use a token with higher rate limits

### Error: "No analysis report found"

**Solution**: Run `npm run analyze` before trying to disable or view reports.

## API Rate Limiting

The tool respects GitHub API rate limits:
- **Authenticated requests**: 5,000 requests per hour
- The tool will warn you when you have <100 requests remaining
- Adjust `maxConcurrentRequests` in config if you experience rate limiting

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Interface                          │
│                        (cli.ts)                             │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─► analyze ──────────┐
                │                     │
                ├─► disable ──────────┤
                │                     │
                ├─► restore ──────────┤
                │                     │
                └─► report ───────────┤
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
          ┌─────────▼──────────┐           ┌──────────▼────────┐
          │  Workflow Analyzer │           │  Report Generator │
          │   (analyzer.ts)    │           │(report-generator) │
          └─────────┬──────────┘           └───────────────────┘
                    │
          ┌─────────▼──────────┐
          │   GitHub Client    │
          │ (github-client.ts) │
          └─────────┬──────────┘
                    │
          ┌─────────▼──────────┐
          │    GitHub API      │
          │   (@octokit/rest)  │
          └────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               Workflow Disabler & Audit Logger              │
│            (workflow-disabler.ts)                           │
└─────────────────────────────────────────────────────────────┘
```

## Development

### Build

```bash
npm run build
```

### Project Structure

```
automation/
├── src/
│   ├── cli.ts                 # CLI interface
│   ├── analyzer.ts            # Workflow analysis logic
│   ├── github-client.ts       # GitHub API wrapper
│   ├── report-generator.ts    # Report generation
│   ├── workflow-disabler.ts   # Workflow disabling/restoring
│   ├── config.ts              # Configuration loader
│   └── types.ts               # TypeScript interfaces
├── config.json                # Configuration file
├── config.schema.json         # Configuration JSON schema
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the troubleshooting guide above
2. Review the audit log for error details
3. Open an issue on GitHub

## Success Metrics

After running this solution, you should see:

1. ✅ Clear visibility into which workflows are failing and why
2. ✅ Failing workflows automatically disabled (with confirmation)
3. ✅ Immediate reduction in excessive workflow runs
4. ✅ Easy restoration when issues are fixed
5. ✅ Actionable recommendations for fixing workflow issues

Expected reduction: From 700+ workflow runs per week to manageable levels by disabling consistently failing workflows.

---

## Automation Templates

### Purpose

The automation library provides reusable templates for:

- CI/CD pipelines
- Infrastructure as Code (IaC)
- Deployment workflows
- Testing automation
- Development tooling

### Integration with Foundation Repository

Templates in this library are designed to work seamlessly with the infrastructure defined in the `/foundation` repository. Common integrations include:

- Infrastructure provisioning templates
- Environment configuration templates
- Security and compliance automation

### Integration with Codex Repository

This library connects to the `codex` repository for:

- Documentation generation templates
- Knowledge base automation
- Cross-repository documentation workflows

### Template Categories

Templates are organized in the following directories:

- `templates/workflows/` - GitHub Actions workflow templates
- `templates/infrastructure/` - Infrastructure as Code templates
- `templates/industries/` - Industry-specific system templates
- `templates/repos/` - Repository scaffolding templates

---

## Contributing

When adding new templates or tools:

1. Create templates in the appropriate category directory
2. Include documentation for each template
3. Ensure templates follow organizational standards
4. Test templates before submitting

## License

MIT License - see LICENSE file for details
