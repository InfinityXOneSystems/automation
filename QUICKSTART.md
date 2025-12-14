# Quick Start Guide

Get up and running with the GitHub Actions Workflow Analyzer in 5 minutes!

## Prerequisites

✅ Node.js 18 or higher  
✅ GitHub Personal Access Token with `repo`, `workflow`, and `read:org` permissions

## 1. Installation (2 minutes)

```bash
# Clone the repository
git clone https://github.com/InfinityXOneSystems/automation.git
cd automation

# Install dependencies
npm install

# Build the project
npm run build
```

## 2. Configuration (1 minute)

Set your GitHub token:

```bash
export GITHUB_TOKEN="ghp_your_personal_access_token_here"
```

**Don't have a token?** Get one at: https://github.com/settings/tokens/new

Required permissions:
- [x] `repo` - Full control of private repositories
- [x] `workflow` - Update GitHub Action workflows  
- [x] `read:org` - Read organization data

## 3. Run Your First Analysis (2 minutes)

```bash
npm run analyze
```

**What happens:**
- Scans all 45+ repositories in InfinityXOneSystems
- Analyzes workflow run history (last 7 days)
- Identifies failing workflows
- Generates reports

**Output files:**
- `workflow-analysis-report.json` - Machine-readable
- `workflow-analysis-report.md` - Human-readable

## 4. Review the Report

```bash
npm run report
```

Look for:
- Total failing workflows
- Failure reasons (consecutive failures, high failure rate, never succeeded)
- Per-repository breakdown
- Known issues detected

## 5. Disable Failing Workflows (Optional)

**Preview first (recommended):**
```bash
npm run disable --dry-run
```

**Actually disable:**
```bash
npm run disable --confirm
```

**What happens:**
- Creates backups of workflow files
- Generates restoration manifest
- Logs all actions
- Reduces excessive workflow runs

## 6. Restore Workflows (When Fixed)

```bash
# Restore all workflows
npm run restore --all --confirm

# Or restore specific repository
npm run restore --repo=index --confirm

# Or restore specific workflow
npm run restore --workflow=ci.yml --confirm
```

## Common Commands

```bash
# Analyze workflows
npm run analyze

# Preview disabling
npm run disable --dry-run

# Actually disable
npm run disable --confirm

# View report
npm run report

# Restore all
npm run restore --all --confirm

# Get help
node dist/cli.js --help
node dist/cli.js analyze --help
```

## What's Next?

### Customize Configuration

Edit `config.json`:

```json
{
  "failureThreshold": 3,
  "failureRateThreshold": 80,
  "timeWindowDays": 7,
  "excludeRepositories": [],
  "safelistWorkflows": []
}
```

### Schedule Regular Analysis

Add to crontab (runs every Monday at 9 AM):

```bash
0 9 * * 1 cd /path/to/automation && npm run analyze
```

### Set Up Alerts

Check for high failure rates and alert:

```bash
#!/bin/bash
npm run analyze
FAILURES=$(node -e "const r=require('./workflow-analysis-report.json'); console.log(r.failingWorkflows)")
if [ "$FAILURES" -gt 20 ]; then
  echo "⚠️ Alert: $FAILURES workflows failing!"
  # Send notification (email, Slack, etc.)
fi
```

## Troubleshooting

### "GitHub token is required"

```bash
export GITHUB_TOKEN="ghp_your_token"
```

### "Organization not found"

Verify:
1. Token has `read:org` permission
2. You're a member of InfinityXOneSystems
3. Organization name is correct in config.json

### "Rate limit exceeded"

Wait for reset or lower `maxConcurrentRequests` in config.json

### "No analysis report found"

Run `npm run analyze` first

## Safety Tips

✅ **Always use dry-run first**: `--dry-run` is default  
✅ **Review reports before disabling**: Use `npm run report`  
✅ **Backups are automatic**: Check `workflow-backups/` directory  
✅ **Audit log tracks everything**: Review `audit-log.json`  
✅ **Easy restoration**: Use `npm run restore`

## Expected Results

After running this solution:

1. ✅ **Clear visibility** - Know exactly which workflows are failing and why
2. ✅ **Automated action** - Failing workflows disabled with confirmation
3. ✅ **Reduced runs** - From 700+/week to manageable levels
4. ✅ **Easy fixes** - Restore workflows when issues are resolved
5. ✅ **Actionable insights** - Specific recommendations for each issue

## Need Help?

- 📖 [Full Documentation](README.md)
- 📚 [Detailed Usage Examples](USAGE.md)
- 🐛 [Troubleshooting Guide](README.md#troubleshooting)
- 💬 [Open an Issue](https://github.com/InfinityXOneSystems/automation/issues)

## Success!

You've successfully set up the Workflow Analyzer! 🎉

Now you can:
- Analyze workflows weekly
- Disable failing ones
- Restore when fixed
- Reduce excessive workflow runs

**Next steps:**
1. Schedule regular analysis
2. Set up alerting
3. Monitor the audit log
4. Customize configuration

Happy automating! 🚀
