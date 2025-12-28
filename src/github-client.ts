import { Octokit } from '@octokit/rest';
import { Config, WorkflowInfo, WorkflowRun } from './types.js';

export class GitHubClient {
  private octokit: Octokit;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.githubToken,
      request: {
        timeout: 60000,
      },
    });
  }

  async getOrganizationRepositories(): Promise<string[]> {
    const repositories: string[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      try {
        const response = await this.octokit.repos.listForOrg({
          org: this.config.organization,
          per_page: perPage,
          page,
          type: 'all',
        });

        if (response.data.length === 0) {
          break;
        }

        repositories.push(...response.data.map((repo) => repo.name));

        if (response.data.length < perPage) {
          break;
        }

        page++;
      } catch (error: any) {
        if (error.status === 404) {
          throw new Error(
            `Organization '${this.config.organization}' not found or you don't have access. ` +
            `Ensure your GitHub token has 'read:org' permission and you are a member of the organization. ` +
            `You can check your token permissions at https://github.com/settings/tokens`
          );
        }
        throw error;
      }
    }

    // Filter out excluded repositories
    return repositories.filter(
      (repo) => !this.config.excludeRepositories.includes(repo)
    );
  }

  async getWorkflows(repo: string): Promise<WorkflowInfo[]> {
    try {
      const response = await this.octokit.actions.listRepoWorkflows({
        owner: this.config.organization,
        repo,
      });

      return response.data.workflows.map((workflow) => ({
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        id: workflow.id,
      }));
    } catch (error: any) {
      if (error.status === 404) {
        // Repository might not have workflows or doesn't exist
        return [];
      }
      console.error(`Error fetching workflows for ${repo}:`, error.message);
      return [];
    }
  }

  async getWorkflowRuns(
    repo: string,
    workflowId: number,
    created?: string
  ): Promise<WorkflowRun[]> {
    try {
      const response = await this.octokit.actions.listWorkflowRuns({
        owner: this.config.organization,
        repo,
        workflow_id: workflowId,
        per_page: 100,
        created,
      });

      return response.data.workflow_runs.map((run) => ({
        id: run.id,
        name: run.name || '',
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
        run_number: run.run_number,
        html_url: run.html_url,
      }));
    } catch (error: any) {
      console.error(
        `Error fetching workflow runs for ${repo} workflow ${workflowId}:`,
        error.message
      );
      return [];
    }
  }

  async getWorkflowContent(repo: string, path: string): Promise<string | null> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.config.organization,
        repo,
        path,
      });

      if ('content' in response.data && response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (error: any) {
      console.error(
        `Error fetching workflow content for ${repo}:${path}:`,
        error.message
      );
      return null;
    }
  }

  async checkRateLimit(): Promise<void> {
    const response = await this.octokit.rateLimit.get();
    const { remaining, limit, reset } = response.data.rate;

    if (remaining < 100) {
      const resetDate = new Date(reset * 1000);
      console.warn(
        `Warning: Only ${remaining}/${limit} API requests remaining. Resets at ${resetDate.toISOString()}`
      );
    }
  }
}
