import DataLoader from 'dataloader';
import { GithubApi } from './datasources/github.rest-api';

export type RepoDetailsKey = { url: string };
export type RepoDetailsResult = { fileCount: number; fileUrl: string | null };

export type DataSourceContext = {
  dataSources: {
    githubApi: GithubApi;
  };
  repoDetailsLoader: DataLoader<RepoDetailsKey, RepoDetailsResult>;
};
