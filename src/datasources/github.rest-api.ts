import { GraphQLError } from 'graphql';
import { RepoContentItem, Repository, WebHook } from './../types';
import {
  AugmentedRequest,
  DataSourceConfig,
  RESTDataSource,
} from '@apollo/datasource-rest';
import { RepoDetailsResult } from './../context';

export class GithubApi extends RESTDataSource {
  baseURL = 'https://api.github.com/';
  accessToken: string;
  requestCount = 0;

  constructor(config?: DataSourceConfig) {
    super(config);
  }

  override willSendRequest(_path: string, request: AugmentedRequest) {
    request.headers['authorization'] = `Bearer ${this.accessToken}`;
    request.headers['Accept'] = 'application/vnd.github+json';

    console.info(`request Id: ${this.requestCount++}`);
  }

  async getRepositories(
    pageItems: number,
    page: number,
    token: string
  ): Promise<Repository[]> {
    this.accessToken = token;
    return this.get<Repository[]>(`user/repos`, {
      params: {
        per_page: pageItems.toString(),
        page: page.toString(),
      },
    });
  }

  async getRepositoryDetails(
    user: string,
    repo: string,
    token: string
  ): Promise<Repository> {
    this.accessToken = token;
    return this.get<Repository>(`repos/${user}/${repo}`);
  }

  async getFileCount(user: string, repo: string): Promise<Repository> {
    return this.get<Repository>(`repos/${user}/${repo}`);
  }

  async getFileConent(fileUrl: string): Promise<string> {
    try {
      const repoDetails = await this.get<Repository & { content: string }>(
        `${fileUrl}`
      );
      return repoDetails.content;
    } catch (err) {
      throw new GraphQLError(`Error with repository content: ${err.message}`);
    }
  }

  async getWebhooks(user: string, repo: string): Promise<WebHook[]> {
    try {
      const hooks = await this.get<WebHook[]>(`repos/${user}/${repo}/hooks`);
      return hooks.filter((webhook) => webhook.active === true);
    } catch (err) {
      console.error(err.message);
      return [];
    }
  }

  async getRepoFileCount(url: string): Promise<RepoDetailsResult> {
    try {
      const content = await this.get<RepoContentItem[]>(url);

      let fileCount = 0;
      let fileUrl: string | null = null;

      for (const item of content) {
        if (item.type === 'file') {
          if (!fileUrl) {
            const isYamlFile = /\.(yaml|yml)$/i.test(item.name);
            if (isYamlFile) {
              fileUrl = item.url;
            }
          }

          fileCount += 1;
        } else if (item.type === 'dir') {
          const nestedFileCount = await this.getRepoFileCount(item.url);
          fileCount += nestedFileCount.fileCount;

          if (!fileUrl && nestedFileCount.fileUrl) {
            fileUrl = nestedFileCount.fileUrl;
          }
        }
      }

      return { fileCount, fileUrl };
    } catch (err) {
      if (err instanceof GraphQLError) throw err;
      throw new GraphQLError(
        `Error while fetching repository details: ${err.message}`
      );
    }
  }
}
