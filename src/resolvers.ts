import { Resolvers } from './types';

export const resolvers: Resolvers = {
  Query: {
    repositories: async (_, { pageItems, page }, { dataSources }) => {
      const result = await dataSources.githubApi.getRepositories(
        pageItems,
        page
      );
      console.log({ repos: result.length });

      return result;
    },
    repositoryDetails: (_, { user, repo }, { dataSources }) => {
      return dataSources.githubApi.getRepositoryDetails(user, repo);
    },
  },
  Repository: {
    fileCount: async ({ url }, __, { dataSources }) => {
      const result = await dataSources.githubApi.getRepoFileCount(
        `${url}/contents`
      );

      return result.fileCount;
    },
    fileContent: async ({ url }, __, { dataSources }) => {
      const result = await dataSources.githubApi.getRepoFileCount(
        `${url}/contents`
      );

      return result.yamlUrl;
    },
    webhooks: async ({ owner, name }, __, { dataSources }) => {
      return dataSources.githubApi.getWebhooks(owner.login, name);
    },
  },
};
