import { GraphQLRequestContext, GraphQLRequestListener } from '@apollo/server';
import { v4 as uuid } from 'uuid';
import QueryLimitExceededError from './helpers/errors/query-limit-exeeder';

const runningQueries: Map<string, { query: string; variables: any }> =
  new Map();

const createQueryLimitPlugin = (queryLimitMap: Map<string, number>) => {
  const QueryLimitPlugin = {
    async requestDidStart(
      ctx: GraphQLRequestContext<any>
    ): Promise<GraphQLRequestListener<any>> {
      const requestId = uuid();

      const queryName = Array.from(queryLimitMap.keys()).find((key) =>
        ctx.request.query?.includes(key)
      );

      if (queryName) {
        const limit = queryLimitMap.get(queryName) || 0;

        const currentCount = Array.from(runningQueries.values()).filter(
          (runningQuery) => runningQuery.query.includes(queryName)
        ).length;

        if (currentCount >= limit) {
          return {
            async didResolveOperation() {
              throw new QueryLimitExceededError(queryName);
            },
          };
        }
      }

      runningQueries.set(requestId, {
        query: ctx.request.query || '',
        variables: ctx.request.variables || {},
      });
      console.log(`Request started! ${requestId}`);

      return {
        async willSendResponse() {
          runningQueries.delete(requestId);
          console.log(`Response sent! ${requestId}`);
        },
      };
    },
  };

  return QueryLimitPlugin;
};

export default createQueryLimitPlugin;
