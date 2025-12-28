#!/usr/bin/env node
/**
 * Build System - Multi-repo orchestration
 *
 * Builds complete systems from industry templates
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
class SystemBuilder {
    /**
     * Build system from config
     */
    async buildSystem(configPath, execute = false) {
        console.log('🏗️  Infinity Prime - System Builder\n');
        if (!existsSync(configPath)) {
            console.error(`❌ Config file not found: ${configPath}`);
            process.exit(1);
        }
        const config = this.loadConfig(configPath);
        console.log(`System: ${config.name}`);
        if (config.description) {
            console.log(`Description: ${config.description}`);
        }
        console.log(`Repositories: ${config.repos.length}\n`);
        // Validate dependencies
        this.validateDependencies(config);
        // Build execution plan
        const plan = this.createExecutionPlan(config);
        console.log('Execution Plan:');
        plan.forEach((step, i) => {
            console.log(`  ${i + 1}. ${step.name} (${step.template})`);
            if (step.depends && step.depends.length > 0) {
                console.log(`     Depends on: ${step.depends.join(', ')}`);
            }
        });
        if (!execute) {
            console.log('\n⚠️  DRY RUN MODE');
            console.log('   Add --execute flag to actually build the system\n');
            // Save execution plan
            const planPath = join(process.cwd(), 'docs', 'system', `build-plan-${config.name}.json`);
            writeFileSync(planPath, JSON.stringify({ config, plan }, null, 2));
            console.log(`📄 Execution plan saved: ${planPath}\n`);
        }
        else {
            console.log('\n🚀 Building system...');
            console.log('   (In production, this would create all repos and set up integrations)\n');
        }
    }
    /**
     * Load config file (YAML or JSON)
     */
    loadConfig(configPath) {
        const content = readFileSync(configPath, 'utf-8');
        if (configPath.endsWith('.json')) {
            return JSON.parse(content);
        }
        else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
            // Simple YAML parser for basic configs
            // In production, use a proper YAML parser
            console.warn('⚠️  Using simplified YAML parser. For production, install js-yaml');
            return this.parseSimpleYaml(content);
        }
        else {
            throw new Error('Unsupported config format. Use .json or .yaml');
        }
    }
    /**
     * Simple YAML parser (limited functionality)
     */
    parseSimpleYaml(content) {
        // This is a very basic parser for demonstration
        // In production, use js-yaml library
        const lines = content.split('\n');
        const config = { name: '', repos: [] };
        let currentRepo = null;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || !trimmed)
                continue;
            if (trimmed.startsWith('name:')) {
                config.name = trimmed.split(':')[1].trim().replace(/"/g, '');
            }
            else if (trimmed.startsWith('- name:')) {
                if (currentRepo)
                    config.repos.push(currentRepo);
                currentRepo = { name: trimmed.split(':')[1].trim() };
            }
            else if (currentRepo && trimmed.startsWith('template:')) {
                currentRepo.template = trimmed.split(':')[1].trim();
            }
        }
        if (currentRepo)
            config.repos.push(currentRepo);
        return config;
    }
    /**
     * Validate dependencies
     */
    validateDependencies(config) {
        const repoNames = new Set(config.repos.map(r => r.name));
        for (const repo of config.repos) {
            if (repo.depends) {
                for (const dep of repo.depends) {
                    if (!repoNames.has(dep)) {
                        throw new Error(`Invalid dependency: ${repo.name} depends on ${dep}, which doesn't exist`);
                    }
                }
            }
        }
    }
    /**
     * Create execution plan (topological sort)
     */
    createExecutionPlan(config) {
        const plan = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (repo) => {
            if (visited.has(repo.name))
                return;
            if (visiting.has(repo.name)) {
                throw new Error(`Circular dependency detected involving ${repo.name}`);
            }
            visiting.add(repo.name);
            if (repo.depends) {
                for (const depName of repo.depends) {
                    const dep = config.repos.find(r => r.name === depName);
                    if (dep)
                        visit(dep);
                }
            }
            visiting.delete(repo.name);
            visited.add(repo.name);
            plan.push(repo);
        };
        for (const repo of config.repos) {
            visit(repo);
        }
        return plan;
    }
}
// Main execution
async function main() {
    const args = process.argv.slice(2);
    const configPath = args.find(a => a.startsWith('--config='))?.split('=')[1];
    const execute = args.includes('--execute');
    if (!configPath) {
        console.log('Usage: npm run prime:build-system -- --config=<path> [--execute]');
        console.log('\nOptions:');
        console.log('  --config=<path>    Path to system config file (YAML or JSON)');
        console.log('  --execute          Actually build the system (default: dry-run)');
        console.log('\nExample configs are in templates/industries/');
        process.exit(1);
    }
    const builder = new SystemBuilder();
    await builder.buildSystem(configPath, execute);
    process.exit(0);
}
main();
//# sourceMappingURL=build-system.js.map