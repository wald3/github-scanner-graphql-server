import { GithubApi } from './datasources/github.rest-api';

export type DataSourceContext = {
  dataSources: {
    githubApi: GithubApi;
  };
};
