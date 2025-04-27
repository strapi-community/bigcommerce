import { getConfig } from '../../utils';
import { StrapiContext } from '../../@types';
import { PluginConfig } from '../../config/schema';
import { BigCommerceGqlProduct, BigCommerceGqlSearchProductsResponse } from '../@types';
import { LRUCache } from 'lru-cache';
import { BASE_API_URL } from '../../const';

type StorefrontTokenCacheKey = string;
interface StorefrontTokenCacheValue {
  token: string;
  expiresAt: number;
}

export const getGQLClient = ({ strapi }: StrapiContext) => {
  const config = getConfig(strapi) as PluginConfig;

  const tokenCache = new LRUCache<StorefrontTokenCacheKey, StorefrontTokenCacheValue>({
    max: 10, // support up to 10 different store/origin combos
  });

  const getTokenCacheKey = (storeHash: string, origins: string[]) => {
    return `${storeHash}|${origins.sort().join(',')}`;
  };

  const createStorefrontToken = async (
    storeHash: string,
    accessToken: string,
    allowedCorsOrigins: string[]
  ): Promise<StorefrontTokenCacheValue> => {
    const url = `${BASE_API_URL}/stores/${storeHash}/v3/storefront/api-token`;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600;
    const body = {
      channel_ids: [1], // TODO: make configurable if needed
      expires_at: expiresAt,
      allowed_cors_origins: allowedCorsOrigins, // TODO: make configurable if needed
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Auth-Token': accessToken,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Failed to create Storefront token: ${res.status} ${res.statusText}`);
    }
    const json: any = await res.json();
    if (!json.data || !json.data.token) {
      throw new Error('Invalid response from Storefront token endpoint');
    }
    return { token: json.data.token, expiresAt };
  };

  const getStorefrontToken = async () => {
    const allowedCorsOrigins = (config as any).allowedCorsOrigins || [];
    const cacheKey = getTokenCacheKey(config.storeHash, allowedCorsOrigins);
    const now = Math.floor(Date.now() / 1000);
    let cached = tokenCache.get(cacheKey);
    if (!cached || cached.expiresAt - now < 60) {
      cached = await createStorefrontToken(
        config.storeHash,
        config.accessToken,
        allowedCorsOrigins
      );
      tokenCache.set(cacheKey, cached);
    }
    return cached.token;
  };

  const gqlRequest = async <T>(query: string, variables?: Record<string, any>): Promise<T> => {
    const url = `https://store-${config.storeHash}.mybigcommerce.com/graphql`; // TODO: extract to config
    const token = await getStorefrontToken();
    try {
      const init = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      };
      const res = await fetch(url, init);
      if (!res.ok) {
        strapi.log.error(`BigCommerce GQL API network error: ${res.status} ${res.statusText}`, {
          query,
          variables,
        });
        throw new Error(`BigCommerce GQL API error: ${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as unknown as T & { errors?: any };
      if ('errors' in json && json.errors) {
        strapi.log.error('BigCommerce GQL API returned errors', {
          errors: json.errors,
          query,
          variables,
        });
        throw new Error(`BigCommerce GQL error: ${JSON.stringify(json.errors)}`);
      }
      return json;
    } catch (error) {
      strapi.log.error('BigCommerce GQL request failed', {
        error,
        query,
        variables,
      });
      throw error;
    }
  };

  // Search products by name fragment (GQL)
  const searchProductsByNameGQL = async (
    nameFragment: string
  ): Promise<Pick<BigCommerceGqlProduct, 'productId' | 'name' | 'id'>[]> => {
    const query = `
        query SearchProducts($searchTerm: String!) {
          site {
            search {
              searchProducts(filters: { searchTerm: $searchTerm }) {
                products(first: 10) {
                  edges {
                    node {
                      entityId
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `;
    const { data } = await gqlRequest<BigCommerceGqlSearchProductsResponse>(query, {
      searchTerm: nameFragment,
    });
    
    return data.site.search.searchProducts.products.edges.map((e) => ({
      productId: e.node.entityId,
      name: e.node.name,
      id: e.node.entityId,
    }));
  };

  return {
    searchProductsByName: searchProductsByNameGQL,
  };
};
