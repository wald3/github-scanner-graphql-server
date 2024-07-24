import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { gql } from 'graphql-tag';
import path from 'path';
import { GithubApi } from './datasources/github.rest-api';
import { resolvers } from './resolvers';
import createQueryLimitPlugin from './query-limit-plugin';
import DataLoader from 'dataloader';
import { batchLoadRepoDetails } from './dataloaders/repo-deatails.loader';

const typeDefs = gql(
  readFileSync(path.resolve(__dirname, './schema.graphql'), {
    encoding: 'utf-8',
  })
);

const QueryLimitPlugin = createQueryLimitPlugin(
  new Map<string, number>([['repositoryDetails', 2]])
);

const dataSources = {
  githubApi: new GithubApi(),
};

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
