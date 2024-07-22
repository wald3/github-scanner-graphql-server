import { ApolloServer } from '@apollo/server';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';

import { readFileSync } from 'fs';
import { gql } from 'graphql-tag';
import path from 'path';

import { GithubApi } from './datasources/github.rest-api';
import { resolvers } from './resolvers';

console.log({ GH_TOKEN: process.env?.god_token });

const typeDefs = gql(
  readFileSync(path.resolve(__dirname, './schema.graphql'), {
    encoding: 'utf-8',
  })
);

async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    cache: new InMemoryLRUCache({ ttl: 600 }),
    plugins: [
      ApolloServerPluginCacheControl({
        defaultMaxAge: 0,
        calculateHttpHeaders: true,
      }),
    ],
  });
  const accessToken = process.env?.god_token;

  const { url } = await startStandaloneServer(server, {
    context: async () => {
      return {
        dataSources: {
          githubApi: new GithubApi(accessToken),
          cacheControl: {
            defaultMaxAge: 0,
            calculateHttpHeaders: true,
          },
        },
      };
    },
  });

  console.log(`Server is running at ${url}`);
}

startApolloServer();
