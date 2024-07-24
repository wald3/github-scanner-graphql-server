import { DataSourceContext } from './../context';

export async function batchLoadRepoDetails(
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
