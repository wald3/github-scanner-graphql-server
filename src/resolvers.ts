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
    fileCount: async ({ url }, __, { repoDetailsLoader }) => {
      const { fileCount } = await repoDetailsLoader.load({ url });
      return fileCount;
    },
    fileContent: async ({ url }, __, { repoDetailsLoader, dataSources }) => {
      const { fileUrl } = await repoDetailsLoader.load({ url });
      if (!fileUrl) return null;

      try {
        const contentBase64 = await dataSources.githubApi.getFileConent(
          fileUrl
        );
        const content = parseBase64(contentBase64);

        return content;
      } catch (err) {
        console.log(`fileContent parseBase64 ${err.message}`);

        return null;
      }
    },
    webhooks: async ({ owner, name }, __, { dataSources }) => {
      return dataSources.githubApi.getWebhooks(owner.login, name);
    },
  },
};
