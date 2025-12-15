import fs from 'fs-extra';
import { Config } from './types.js';

const DEFAULT_CONFIG: Config = {
  failureThreshold: 3,
  failureRateThreshold: 80,
  timeWindowDays: 7,
  excludeRepositories: [],
  safelistWorkflows: [],
  dryRun: true,
  organization: 'InfinityXOneSystems',
  maxConcurrentRequests: 5,
  backupDirectory: 'workflow-backups',
};

export async function loadConfig(configPath?: string): Promise<Config> {
  let config: Config = { ...DEFAULT_CONFIG };

  // Load from config file if exists
  const configFile = configPath || 'config.json';
  if (await fs.pathExists(configFile)) {
    const fileConfig = await fs.readJson(configFile);
    config = { ...config, ...fileConfig };
  }

  // Override with environment variables
  if (process.env.GITHUB_TOKEN) {
    config.githubToken = process.env.GITHUB_TOKEN;
  }
  if (process.env.GITHUB_ORG) {
    config.organization = process.env.GITHUB_ORG;
  }
  if (process.env.FAILURE_THRESHOLD) {
    config.failureThreshold = parseInt(process.env.FAILURE_THRESHOLD, 10);
  }
  if (process.env.FAILURE_RATE_THRESHOLD) {
    config.failureRateThreshold = parseInt(process.env.FAILURE_RATE_THRESHOLD, 10);
  }
  if (process.env.TIME_WINDOW_DAYS) {
    config.timeWindowDays = parseInt(process.env.TIME_WINDOW_DAYS, 10);
  }

  return config;
}

export function validateConfig(config: Config): void {
  if (!config.githubToken) {
    throw new Error(
      'GitHub token is required. Set GITHUB_TOKEN environment variable or add it to config.json'
    );
  }

  if (!config.organization) {
    throw new Error('Organization name is required');
  }

  if (config.failureThreshold < 1) {
    throw new Error('Failure threshold must be at least 1');
  }

  if (config.failureRateThreshold < 0 || config.failureRateThreshold > 100) {
    throw new Error('Failure rate threshold must be between 0 and 100');
  }

  if (config.timeWindowDays < 1) {
    throw new Error('Time window must be at least 1 day');
  }
}
