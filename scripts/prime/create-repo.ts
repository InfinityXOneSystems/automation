#!/usr/bin/env node
/**
 * Create Repo - Repository creator with Infinity Prime templates
 * 
 * Creates new repos with:
 * - Full Infinity Prime pre-configured
 * - Workflow templates
 * - Integration with /foundation and codex
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

interface RepoTemplate {
  name: string;
  description: string;
  tech: string[];
  files: string[];
}

const TEMPLATES: Record<string, RepoTemplate> = {
  'node-api': {
    name: 'Node.js API',
    description: 'Express/Fastify API server',
    tech: ['Node.js', 'TypeScript', 'Express'],
    files: ['package.json', 'tsconfig.json', 'src/index.ts']
  },
  'python-api': {
    name: 'Python API',
    description: 'FastAPI server',
    tech: ['Python', 'FastAPI', 'Pydantic'],
    files: ['requirements.txt', 'main.py', 'pyproject.toml']
  },
  'react-spa': {
    name: 'React SPA',
    description: 'Vite + React application',
    tech: ['React', 'TypeScript', 'Vite'],
    files: ['package.json', 'vite.config.ts', 'src/App.tsx']
  },
  'next-app': {
    name: 'Next.js App',
    description: 'Next.js 14+ application',
    tech: ['Next.js', 'React', 'TypeScript'],
    files: ['package.json', 'next.config.js', 'app/page.tsx']
  },
  'rust-service': {
    name: 'Rust Service',
    description: 'Actix/Axum service',
    tech: ['Rust', 'Actix', 'Tokio'],
    files: ['Cargo.toml', 'src/main.rs']
  },
  'taxonomy': {
    name: 'Taxonomy Repo',
    description: 'AI model taxonomy',
    tech: ['TypeScript', 'Node.js'],
    files: ['package.json', 'models.json']
  }
};

class RepoCreator {
  /**
   * Create new repository
   */
  async createRepo(options: {
    name: string;
    template: string;
    integrateFoundation: boolean;
    integrateCodex: boolean;
  }): Promise<void> {
    console.log('🚀 Infinity Prime - Repository Creator\n');

    const template = TEMPLATES[options.template];
    if (!template) {
      console.error(`❌ Unknown template: ${options.template}`);
      console.log('\nAvailable templates:');
      Object.keys(TEMPLATES).forEach(key => {
        console.log(`  - ${key}: ${TEMPLATES[key].description}`);
      });
      process.exit(1);
    }

    console.log(`Creating repository: ${options.name}`);
    console.log(`Template: ${template.name}`);
    console.log(`Description: ${template.description}`);
    console.log(`Technologies: ${template.tech.join(', ')}`);
    
    if (options.integrateFoundation) {
      console.log('✅ Foundation integration enabled');
    }
    if (options.integrateCodex) {
      console.log('✅ Codex integration enabled');
    }

    console.log('\n⚠️  This is a DRY RUN. In production, this would:');
    console.log('   1. Create GitHub repository via API');
    console.log('   2. Initialize with template files');
    console.log('   3. Set up CI/CD workflows');
    console.log('   4. Configure Infinity Prime');
    if (options.integrateFoundation) {
      console.log('   5. Trigger infrastructure provisioning via /foundation');
    }
    if (options.integrateCodex) {
      console.log('   6. Generate documentation via codex');
    }

    // Create spec file
    const spec = {
      name: options.name,
      template: options.template,
      templateDetails: template,
      integrations: {
        foundation: options.integrateFoundation,
        codex: options.integrateCodex
      },
      created: new Date().toISOString(),
      status: 'dry-run'
    };

    const specPath = join(process.cwd(), 'docs', 'system', `repo-spec-${options.name}.json`);
    writeFileSync(specPath, JSON.stringify(spec, null, 2));
    
    console.log(`\n📄 Repository spec saved: ${specPath}\n`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  const name = args.find(a => a.startsWith('--name='))?.split('=')[1];
  const template = args.find(a => a.startsWith('--template='))?.split('=')[1];
  const integrateFoundation = args.includes('--integrate-foundation');
  const integrateCodex = args.includes('--integrate-codex');

  if (!name || !template) {
    console.log('Usage: npm run prime:create-repo -- --name=<name> --template=<template> [options]');
    console.log('\nOptions:');
    console.log('  --name=<name>              Repository name (required)');
    console.log('  --template=<template>      Template to use (required)');
    console.log('  --integrate-foundation     Enable /foundation integration');
    console.log('  --integrate-codex          Enable codex integration');
    console.log('\nAvailable templates:');
    Object.keys(TEMPLATES).forEach(key => {
      console.log(`  - ${key}: ${TEMPLATES[key].description}`);
    });
    process.exit(1);
  }

  const creator = new RepoCreator();
  await creator.createRepo({
    name,
    template,
    integrateFoundation,
    integrateCodex
  });

  process.exit(0);
}

main();
