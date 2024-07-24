import { GraphQLError } from 'graphql';

export default class QueryLimitExceededError extends GraphQLError {
  constructor(queryName: string) {
    super(`Query limit exceeded for ${queryName}`, {
      extensions: { code: 'QUERY_LIMIT_EXCEEDED', queryName },
    });
  }
}
