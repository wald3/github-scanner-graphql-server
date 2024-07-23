import parseBase64 from './helpers/base64-parser';
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
      const { fileCount } = await dataSources.githubApi.getRepoFileCount(
        `${url}/contents`
      );

      return fileCount;
    },
    fileContent: async ({ url }, __, { dataSources }) => {
      const { yamlUrl } = await dataSources.githubApi.getRepoFileCount(
        `${url}/contents`
      );

      const contentBase64 = await dataSources.githubApi.getFileConent(yamlUrl);
      const content = parseBase64(contentBase64);

      return content;
    },
    webhooks: async ({ owner, name }, __, { dataSources }) => {
      return dataSources.githubApi.getWebhooks(owner.login, name);
    },
  },
};
