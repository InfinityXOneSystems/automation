# Contributing to Workflow Analyzer

Thank you for your interest in contributing to the GitHub Actions Workflow Analyzer! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions with the project.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

1. **Clear title** describing the bug
2. **Steps to reproduce** the issue
3. **Expected behavior**
4. **Actual behavior**
5. **Environment details** (Node version, OS, etc.)
6. **Relevant logs or screenshots**

### Suggesting Features

For feature requests:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** - why is this feature needed?
3. **Provide examples** of how it would work
4. **Consider implementation** if you have ideas

### Submitting Changes

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**: `git commit -m "Add feature X"`
6. **Push to your fork**: `git push origin feature/my-feature`
7. **Open a Pull Request**

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- GitHub Personal Access Token

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/automation.git
cd automation

# Install dependencies
npm install

# Build the project
npm run build

# Set up environment
export GITHUB_TOKEN="your_token_here"
```

### Running Tests

Currently, testing is manual:

```bash
# Test configuration loading
node dist/cli.js --help

# Test with dry-run
npm run disable --dry-run
```

### Code Style

- Use **TypeScript** for all source files
- Follow existing **naming conventions**
- Add **JSDoc comments** for public APIs
- Keep functions **small and focused**
- Use **async/await** for asynchronous code

### Project Structure

```
src/
├── cli.ts                 # CLI interface (Commander.js)
├── analyzer.ts            # Core analysis logic
├── github-client.ts       # GitHub API wrapper
├── report-generator.ts    # Report generation
├── workflow-disabler.ts   # Disable/restore logic
├── config.ts              # Configuration management
└── types.ts               # TypeScript interfaces
```

## Pull Request Guidelines

### Before Submitting

- [ ] Code builds without errors: `npm run build`
- [ ] All commands work as expected
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] No sensitive data (tokens, passwords) in code

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code builds successfully
- [ ] Documentation updated
- [ ] No sensitive data included
```

## Adding New Features

### Example: Adding a New Failure Criterion

1. **Update types** in `src/types.ts`:
   ```typescript
   export interface WorkflowAnalysis {
     // ... existing fields
     myNewMetric: number;
   }
   ```

2. **Implement logic** in `src/analyzer.ts`:
   ```typescript
   private async analyzeWorkflow(...) {
     // Calculate new metric
     const myNewMetric = this.calculateNewMetric(runs);
     
     // Add to analysis
     return {
       // ... existing fields
       myNewMetric,
     };
   }
   ```

3. **Update reports** in `src/report-generator.ts`:
   ```typescript
   // Add to report output
   markdown += `- **New Metric**: ${workflow.myNewMetric}\n`;
   ```

4. **Update documentation** in `README.md`

5. **Test thoroughly** with different scenarios

## Testing Guidelines

### Manual Testing Checklist

- [ ] `npm run analyze` works with valid token
- [ ] `npm run analyze` fails gracefully without token
- [ ] `npm run disable --dry-run` shows preview
- [ ] `npm run disable --confirm` creates manifest
- [ ] `npm run restore --dry-run` shows preview
- [ ] `npm run report` displays report
- [ ] Configuration from file works
- [ ] Environment variables override config
- [ ] Rate limiting is handled gracefully

### Testing with Different Scenarios

1. **Empty organization** (no workflows)
2. **All healthy workflows** (no failures)
3. **Mixed workflows** (some failing, some healthy)
4. **High failure rate** (>80% failures)
5. **Consecutive failures** (3+ in a row)

## Documentation

### When to Update Documentation

- Adding new features
- Changing CLI commands or options
- Modifying configuration options
- Fixing bugs that affect usage

### Documentation Files

- `README.md` - Main documentation
- `USAGE.md` - Detailed usage examples
- Code comments - For complex logic
- CLI help text - In `src/cli.ts`

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag: `git tag v1.1.0`
4. Push tag: `git push origin v1.1.0`
5. Create GitHub release with notes

## Questions?

- Open an issue for general questions
- Tag `@InfinityXOneSystems` for urgent matters
- Check existing issues and PRs first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
