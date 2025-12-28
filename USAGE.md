# Usage Examples

This document provides practical examples for using the GitHub Actions Workflow Analyzer.

## Basic Usage

### 1. First Time Setup

```bash
# Clone and install
git clone https://github.com/InfinityXOneSystems/automation.git
cd automation
npm install
npm run build

# Set your GitHub token
export GITHUB_TOKEN="ghp_your_personal_access_token"
```

### 2. Run Your First Analysis

```bash
# Analyze all workflows
npm run analyze
```

This will generate two files:
- `workflow-analysis-report.json` - Machine-readable report
- `workflow-analysis-report.md` - Human-readable report

**Example Output:**
```
Loading configuration...

Starting workflow analysis...

Found 45 repositories to analyze
Analyzing repository: taxonomy
Analyzing repository: foundation
Analyzing repository: Real_Estate_Intelligence
...

Generating reports...
JSON report generated: workflow-analysis-report.json
Markdown report generated: workflow-analysis-report.md

✓ Analysis complete!

Summary:
  - Repositories: 45
  - Total Workflows: 127
  - Failing Workflows: 23
  - Success Rate: 64.5%

⚠️  Action Required:
   Run "npm run disable --dry-run" to preview disabling failing workflows
   Run "npm run disable --confirm" to disable failing workflows
```

### 3. Review the Report

```bash
# View the Markdown report
npm run report

# Or view the JSON report
npm run report --json
```

### 4. Preview Disabling Failing Workflows

```bash
# Dry-run mode (no changes made)
npm run disable --dry-run
```

**Example Output:**
```
🔍 DRY RUN MODE - No changes will be made

Repository: index
  Found 1 workflow(s) to disable
  [DRY RUN] CI Workflow

Repository: Real_Estate_Intelligence
  Found 3 workflow(s) to disable
  [DRY RUN] Deploy Production
  [DRY RUN] Deploy Cloud Run
  [DRY RUN] Intelligence Cron

Would disable 23 workflow(s)

ℹ️  This was a dry run. No changes were made.
   Run "npm run disable --confirm" to actually disable workflows.
```

### 5. Actually Disable Failing Workflows

```bash
# Live mode - actually disables workflows
npm run disable --confirm
```

**Example Output:**
```
⚠️  LIVE MODE - Workflows will be disabled

Repository: index
  Found 1 workflow(s) to disable
  ✓ CI Workflow

Repository: Real_Estate_Intelligence
  Found 3 workflow(s) to disable
  ✓ Deploy Production
  ✓ Deploy Cloud Run
  ✓ Intelligence Cron

Disabled 23 workflow(s)
✓ Disabled workflows manifest saved

✓ Workflows disabled successfully!
   Manifest saved to: disabled-workflows-manifest.json
   Use "npm run restore" to restore workflows if needed.
```

## Advanced Usage

### Custom Configuration

Create a custom config file:

```json
{
  "failureThreshold": 5,
  "failureRateThreshold": 90,
  "timeWindowDays": 14,
  "excludeRepositories": ["private-repo", "archived-repo"],
  "safelistWorkflows": ["critical-deploy.yml", "security-scan.yml"],
  "dryRun": true,
  "organization": "InfinityXOneSystems",
  "maxConcurrentRequests": 3,
  "backupDirectory": "workflow-backups"
}
```

Use it:
```bash
npm run analyze -- -c custom-config.json
```

### Selective Repository Analysis

Exclude specific repositories by adding them to config:

```json
{
  "excludeRepositories": ["test-repo", "archived-repo"]
}
```

### Safelist Critical Workflows

Prevent specific workflows from ever being disabled:

```json
{
  "safelistWorkflows": [
    "production-deploy.yml",
    "security-scan.yml",
    "backup.yml"
  ]
}
```

## Restoration Examples

### Restore All Workflows

```bash
# Preview restoration (dry-run)
npm run restore -- --all --dry-run

# Actually restore all workflows
npm run restore -- --all --confirm
```

### Restore Workflows for a Specific Repository

```bash
# Preview
npm run restore -- --repo=index --dry-run

# Restore
npm run restore -- --repo=index --confirm
```

### Restore a Specific Workflow

```bash
# Preview
npm run restore -- --workflow=ci.yml --dry-run

# Restore
npm run restore -- --workflow=ci.yml --confirm
```

### Restore Specific Workflow in Specific Repository

```bash
npm run restore -- --repo=index --workflow=ci.yml --confirm
```

## Scheduled Automation

### Weekly Analysis with Cron

Add to your crontab:

```bash
# Run analysis every Monday at 9 AM
0 9 * * 1 cd /path/to/automation && npm run analyze

# Disable failing workflows every Monday at 9:30 AM (with confirmation)
30 9 * * 1 cd /path/to/automation && npm run disable --confirm
```

### GitHub Actions Workflow

Create `.github/workflows/analyze-workflows.yml`:

```yaml
name: Weekly Workflow Analysis

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
  workflow_dispatch:

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Run analysis
        env:
          GITHUB_TOKEN: ${{ secrets.WORKFLOW_ANALYZER_TOKEN }}
        run: npm run analyze
      
      - name: Upload reports
        uses: actions/upload-artifact@v4
        with:
          name: workflow-analysis-reports
          path: |
            workflow-analysis-report.json
            workflow-analysis-report.md
      
      - name: Comment PR if failures found
        if: failure()
        run: |
          echo "Workflow analysis found issues. See artifacts for details."
```

## Monitoring and Alerting

### Check for High Failure Rates

```bash
# Analyze and check if action is needed
npm run analyze
FAILURES=$(node -e "const fs=require('fs'); const r=JSON.parse(fs.readFileSync('workflow-analysis-report.json')); console.log(r.failingWorkflows)")

if [ "$FAILURES" -gt 20 ]; then
  echo "⚠️  High number of failing workflows: $FAILURES"
  echo "Consider running: npm run disable --confirm"
fi
```

### Email Report

```bash
#!/bin/bash
npm run analyze
if [ $? -eq 0 ]; then
  mail -s "Weekly Workflow Analysis Report" team@example.com < workflow-analysis-report.md
fi
```

## Troubleshooting Common Issues

### Rate Limit Exceeded

If you hit rate limits:

1. **Lower concurrent requests** in config:
   ```json
   {
     "maxConcurrentRequests": 2
   }
   ```

2. **Use a token with higher limits** (GitHub App token vs PAT)

3. **Wait for rate limit reset**:
   ```bash
   # Check current rate limit
   curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit
   ```

### Large Organization

For organizations with 100+ repositories:

1. **Split analysis** by excluding repos:
   ```json
   {
     "excludeRepositories": ["archived-*", "test-*"]
   }
   ```

2. **Run in batches**:
   ```bash
   # Batch 1
   npm run analyze -- -c config-batch-1.json
   
   # Batch 2
   npm run analyze -- -c config-batch-2.json
   ```

### Authentication Issues

Verify your token has correct permissions:

```bash
# Test token
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Test org access
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/orgs/InfinityXOneSystems
```

Required scopes:
- ✅ `repo`
- ✅ `workflow`
- ✅ `read:org`

## Best Practices

### 1. Always Test with Dry-Run First

```bash
# Bad ❌
npm run disable --confirm

# Good ✅
npm run disable --dry-run  # Review output first
npm run disable --confirm  # Then confirm
```

### 2. Regular Analysis Schedule

Run analysis weekly to catch issues early:

```bash
# Set up weekly cron job
0 9 * * 1 /path/to/automation/analyze.sh
```

### 3. Review Reports Before Disabling

Always review the generated reports to understand why workflows are failing:

```bash
npm run analyze
npm run report  # Review the report
npm run disable --dry-run  # Preview changes
npm run disable --confirm  # Only if you agree
```

### 4. Keep Audit Logs

The tool maintains `audit-log.json`. Review it regularly:

```bash
cat audit-log.json | jq '.entries[] | select(.success == false)'
```

### 5. Backup Configuration

Keep your configuration in version control:

```bash
git add config.json
git commit -m "Update workflow analyzer configuration"
git push
```

## Integration Examples

### Slack Notification

```bash
#!/bin/bash
npm run analyze
FAILURES=$(node -e "const fs=require('fs'); const r=JSON.parse(fs.readFileSync('workflow-analysis-report.json')); console.log(r.failingWorkflows)")

if [ "$FAILURES" -gt 0 ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"⚠️ Found $FAILURES failing workflows. Check the report.\"}" \
    $SLACK_WEBHOOK_URL
fi
```

### Jira Ticket Creation

```bash
#!/bin/bash
npm run analyze
FAILURES=$(node -e "const fs=require('fs'); const r=JSON.parse(fs.readFileSync('workflow-analysis-report.json')); console.log(r.failingWorkflows)")

if [ "$FAILURES" -gt 10 ]; then
  # Create Jira ticket
  curl -u user:token -X POST -H "Content-Type: application/json" \
    --data '{"fields":{"project":{"key":"OPS"},"summary":"High workflow failures detected","description":"'"$FAILURES"' workflows are failing"}}' \
    https://your-domain.atlassian.net/rest/api/2/issue/
fi
```

## Performance Optimization

### For Large Organizations

```json
{
  "maxConcurrentRequests": 10,
  "timeWindowDays": 3,
  "excludeRepositories": ["archived-.*"]
}
```

### For Frequent Runs

Cache results and only re-analyze changed workflows:

```bash
# Daily quick check (last 1 day)
GITHUB_TOKEN=$TOKEN TIME_WINDOW_DAYS=1 npm run analyze

# Weekly full analysis (last 7 days)
GITHUB_TOKEN=$TOKEN TIME_WINDOW_DAYS=7 npm run analyze
```

## Security Considerations

### Token Storage

Never commit tokens to git:

```bash
# Use environment variables
export GITHUB_TOKEN="ghp_..."

# Or use a secrets manager
export GITHUB_TOKEN=$(aws secretsmanager get-secret-value --secret-id github-token --query SecretString --output text)
```

### Audit Trail

Always review the audit log:

```bash
# View recent actions
cat audit-log.json | jq '.entries[-10:]'

# View failed actions
cat audit-log.json | jq '.entries[] | select(.success == false)'
```

### Rollback Plan

Keep the manifest file safe:

```bash
# Backup before major operations
cp disabled-workflows-manifest.json disabled-workflows-manifest.backup.json

# Restore if needed
cp disabled-workflows-manifest.backup.json disabled-workflows-manifest.json
npm run restore --all --confirm
```
