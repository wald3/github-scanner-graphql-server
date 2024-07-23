import { RepoContentItem, Repository, WebHook } from './../types';
import {
  AugmentedRequest,
  DataSourceConfig,
  RESTDataSource,
} from '@apollo/datasource-rest';

export class GithubApi extends RESTDataSource {
  baseURL = 'https://api.github.com/';
  accessToken: string;
  requestCount = 0;

  constructor(accessToken?: string, config?: DataSourceConfig) {
    if (!accessToken) {
      throw new Error('Can`t create a data source without an access-token!');
    }

    super(config);
    this.accessToken = accessToken;
  }

  override willSendRequest(_path: string, request: AugmentedRequest) {
    request.headers['authorization'] = `Bearer ${this.accessToken}`;
    request.headers['Accept'] = 'application/vnd.github+json';

    console.log(`request Id: ${this.requestCount++}`);
  }

  async getRepositories(
    pageItems: number,
    page: number
  ): Promise<Repository[]> {
    return this.get<Repository[]>(`user/repos`, {
      params: {
        per_page: pageItems.toString(),
        page: page.toString(),
      },
    });
  }

  async getRepositoryDetails(user: string, repo: string): Promise<Repository> {
    return this.get<Repository>(`repos/${user}/${repo}`);
  }

  async getFileCount(user: string, repo: string): Promise<Repository> {
    return this.get<Repository>(`repos/${user}/${repo}`);
  }

  async getFileConent(fileUrl: string): Promise<string> {
    return (await this.get<Repository & { content: string }>(`${fileUrl}`))
      .content;
  }

  async getWebhooks(user: string, repo: string): Promise<WebHook[]> {
    try {
      const hooks = await this.get<WebHook[]>(`repos/${user}/${repo}/hooks`);
      return hooks.filter((webhook) => webhook.active === true);
    } catch (error) {
      console.error(error.message);
      return [];
    }
  }

  async getRepoFileCount(
    url: string
  ): Promise<{ fileCount: number; yamlUrl: string | null }> {
    try {
      const content = await this.get<RepoContentItem[]>(url);

      let fileCount = 0;
      let fileUrl = null;

      for (const item of content) {
        if (item.type === 'file') {
          if (!fileUrl) {
            const isYamlFile = /\.(yaml|yml)$/i.test(item.name);
            if (isYamlFile) fileUrl = item.url;
          }

          fileCount += 1;
        } else if (item.type === 'dir') {
          const nestedFileCount = await this.getRepoFileCount(item.url);
          fileCount += nestedFileCount.fileCount;

          if (!fileUrl && nestedFileCount.yamlUrl) {
            fileUrl = nestedFileCount.yamlUrl;
          }
        }
      }

      return { fileCount, yamlUrl: fileUrl };
    } catch (error) {
      console.error('Error fetching repository contents:', error.message);
      return { fileCount: -1, yamlUrl: null };
    }
  }
}
