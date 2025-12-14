#!/usr/bin/env node
/**
 * Run Ledger - Append-only audit trail for all automation runs
 * 
 * Logs every automation run with timestamp, action, and results
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface LedgerEntry {
  id: string;
  timestamp: string;
  action: string;
  module: string;
  status: 'success' | 'failure' | 'partial';
  duration?: number;
  metadata?: Record<string, any>;
  error?: string;
}

interface RunLedger {
  version: string;
  created: string;
  entries: LedgerEntry[];
}

class LedgerManager {
  private ledgerPath: string;
  private ledger: RunLedger;

  constructor() {
    this.ledgerPath = join(process.cwd(), 'docs', 'system', 'RUN_LEDGER.json');
    this.ledger = this.loadLedger();
  }

  /**
   * Load existing ledger or create new one
   */
  private loadLedger(): RunLedger {
    if (existsSync(this.ledgerPath)) {
      try {
        return JSON.parse(readFileSync(this.ledgerPath, 'utf-8'));
      } catch (error) {
        console.warn('⚠️  Failed to load existing ledger, creating new one');
      }
    }

    return {
      version: '1.0.0',
      created: new Date().toISOString(),
      entries: []
    };
  }

  /**
   * Add entry to ledger
   */
  addEntry(entry: Omit<LedgerEntry, 'id' | 'timestamp'>): string {
    const id = this.generateEntryId();
    const fullEntry: LedgerEntry = {
      id,
      timestamp: new Date().toISOString(),
      ...entry
    };

    this.ledger.entries.push(fullEntry);
    this.saveLedger();

    console.log(`📝 Ledger entry added: ${id}`);
    return id;
  }

  /**
   * Generate unique entry ID
   */
  private generateEntryId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    return `${timestamp}-${random}`;
  }

  /**
   * Save ledger to disk
   */
  private saveLedger(): void {
    writeFileSync(this.ledgerPath, JSON.stringify(this.ledger, null, 2));
  }

  /**
   * Get recent entries
   */
  getRecentEntries(count: number = 10): LedgerEntry[] {
    return this.ledger.entries.slice(-count);
  }

  /**
   * Get entries by module
   */
  getEntriesByModule(module: string): LedgerEntry[] {
    return this.ledger.entries.filter(e => e.module === module);
  }

  /**
   * Get entries by status
   */
  getEntriesByStatus(status: LedgerEntry['status']): LedgerEntry[] {
    return this.ledger.entries.filter(e => e.status === status);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const total = this.ledger.entries.length;
    const success = this.ledger.entries.filter(e => e.status === 'success').length;
    const failure = this.ledger.entries.filter(e => e.status === 'failure').length;
    const partial = this.ledger.entries.filter(e => e.status === 'partial').length;

    const moduleStats: Record<string, number> = {};
    this.ledger.entries.forEach(e => {
      moduleStats[e.module] = (moduleStats[e.module] || 0) + 1;
    });

    return {
      total,
      success,
      failure,
      partial,
      successRate: total > 0 ? (success / total) * 100 : 0,
      moduleStats
    };
  }

  /**
   * Display ledger summary
   */
  displaySummary(): void {
    const stats = this.getStatistics();
    const recent = this.getRecentEntries(5);

    console.log('\n📊 Run Ledger Summary\n');
    console.log(`Total Entries: ${stats.total}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(2)}%`);
    console.log(`  ✅ Success: ${stats.success}`);
    console.log(`  ❌ Failure: ${stats.failure}`);
    console.log(`  ⚠️  Partial: ${stats.partial}\n`);

    console.log('Module Breakdown:');
    Object.entries(stats.moduleStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([module, count]) => {
        console.log(`  - ${module}: ${count} runs`);
      });

    if (recent.length > 0) {
      console.log('\nRecent Entries:');
      recent.forEach(entry => {
        const statusEmoji = {
          success: '✅',
          failure: '❌',
          partial: '⚠️'
        };
        console.log(`  ${statusEmoji[entry.status]} [${entry.timestamp}] ${entry.module} - ${entry.action}`);
      });
    }

    console.log(`\n📁 Ledger path: ${this.ledgerPath}\n`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'view';

  const manager = new LedgerManager();

  try {
    switch (command) {
      case 'view':
        manager.displaySummary();
        break;

      case 'add':
        // Example: npm run prime:ledger add --module="validation" --action="full-validation" --status="success"
        const module = args.find(a => a.startsWith('--module='))?.split('=')[1] || 'unknown';
        const action = args.find(a => a.startsWith('--action='))?.split('=')[1] || 'unknown';
        const status = args.find(a => a.startsWith('--status='))?.split('=')[1] as 'success' | 'failure' | 'partial' || 'success';
        const duration = parseInt(args.find(a => a.startsWith('--duration='))?.split('=')[1] || '0');

        manager.addEntry({
          module,
          action,
          status,
          duration: duration || undefined
        });
        break;

      case 'stats':
        const stats = manager.getStatistics();
        console.log(JSON.stringify(stats, null, 2));
        break;

      default:
        console.log('Usage: npm run prime:ledger [command]');
        console.log('\nCommands:');
        console.log('  view    - Display ledger summary (default)');
        console.log('  add     - Add new entry');
        console.log('  stats   - Show statistics as JSON');
        console.log('\nAdd entry options:');
        console.log('  --module=<name>   - Module name');
        console.log('  --action=<name>   - Action name');
        console.log('  --status=<status> - Status (success|failure|partial)');
        console.log('  --duration=<ms>   - Duration in milliseconds');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
