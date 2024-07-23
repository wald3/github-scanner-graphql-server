import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { gql } from 'graphql-tag';
import path from 'path';
import { ApolloServerPluginUsageReporting } from '@apollo/server/plugin/usageReporting';
import { GithubApi } from './datasources/github.rest-api';
import { resolvers } from './resolvers';
import createQueryLimitPlugin from './plugin';
import QueryLimitExceededError from './helpers/errors/query-limit-exeeder';

console.log({ GH_TOKEN: process.env?.god_token });

const typeDefs = gql(
  readFileSync(path.resolve(__dirname, './schema.graphql'), {
    encoding: 'utf-8',
  })
);

const QueryLimitPlugin = createQueryLimitPlugin(
  new Map<string, number>([['repositoryDetails', 1]])
);

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [QueryLimitPlugin],
    formatError: (err) => {
      return {
        message: err.message,
        code: err.extensions.code,
        queryName: err.extensions.queryName,
      };
    },
  });
  const accessToken = process.env?.god_token;

  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        dataSources: {
          githubApi: new GithubApi(accessToken),
        },
      };
    },
  });

  console.log(`Server is running at ${url}`);
}

startApolloServer();
