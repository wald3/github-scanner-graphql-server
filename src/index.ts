import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { gql } from 'graphql-tag';
import path from 'path';
import { GithubApi } from './datasources/github.rest-api';
import { resolvers } from './resolvers';
import createQueryLimitPlugin from './query-limit-plugin';
import DataLoader from 'dataloader';
import { DataSourceContext } from './context';

const typeDefs = gql(
  readFileSync(path.resolve(__dirname, './schema.graphql'), {
    encoding: 'utf-8',
  })
);

const QueryLimitPlugin = createQueryLimitPlugin(
  new Map<string, number>([['repositoryDetails', 2]])
);

async function batchLoadRepoDetails(
  keys: readonly { url: string }[],
  dataSources: DataSourceContext['dataSources']
) {
  const uniqueUrls = Array.from(new Set(keys.map((key) => key.url)));

  try {
    const results = await Promise.all(
      uniqueUrls.map(async (url) => {
        const result = await dataSources.githubApi.getRepoFileCount(
          `${url}/contents`
        );
        return { url, ...result };
      })
    );

    const resultMap = new Map(results.map((result) => [result.url, result]));

    return keys.map((key) => resultMap.get(key.url));
  } catch (err) {
    console.error(err?.mesage);
    throw err;
  }
}

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [QueryLimitPlugin],
    formatError: (err) => {
      console.error(err.message);
      return err;
    },
  });

  const dataSources = {
    githubApi: new GithubApi(),
  };

  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        dataSources,
        repoDetailsLoader: new DataLoader((keys: readonly { url: string }[]) =>
          batchLoadRepoDetails(keys, dataSources)
        ),
      };
    },
  });

  console.log(`Server is running at ${url}`);
}

startApolloServer();
