import { difference } from 'lodash';
import { getConfig, getService } from '../../utils';
import { StrapiContext } from '../../@types';
import { BigCommerceRestProduct } from '../@types';
import { BigCommerceRestProductResponse } from '../@types';
import { PluginConfig } from '../../config/schema';
import { BASE_API_URL } from '../../const';

export const getRestClient = ({ strapi }: StrapiContext) => {
  const config = getConfig(strapi) as PluginConfig;
  const cacheService = getService(strapi, 'cache');

  const getAuthHeaders = () => ({
    'X-Auth-Token': config.accessToken,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  const restRequest = async <T>(path: string, params?: Record<string, any>): Promise<T> => {
    const url = new URL(`${BASE_API_URL}/stores/${config.storeHash}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
        } else if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error(`BigCommerce REST API error: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as T;
    return json;
  };

  const getCacheKey = (id: number) => `big-commerce:product:${id}`;

  const fetchProductsByIds = async (ids: number[]) => {
    if (!ids.length) return [];
    const cacheKeys = ids.map(getCacheKey);
    const cachedResults = await Promise.all(
      cacheKeys.map((key) => cacheService.get<BigCommerceRestProduct>(key))
    );

    const cachedProducts: Record<number, BigCommerceRestProduct> = {};
    const cachedIds: number[] = cachedResults
      .map((product) => {
        if (product) {
          cachedProducts[product.id] = product;
          return product.id;
        }
      })
      .filter(Boolean);
    const missingIds = difference(ids, cachedIds);

    let fetchedProducts: BigCommerceRestProduct[] = [];
    if (missingIds.length) {
      const data = await restRequest<BigCommerceRestProductResponse>('/v3/catalog/products', {
        'id:in': missingIds,
      });
      fetchedProducts = data.data;
      await Promise.all(
        fetchedProducts.map((product) => cacheService.set(getCacheKey(product.id), product))
      );
    }
    return ids
      .map((id) => cachedProducts[id] || fetchedProducts.find((p) => p.id === id))
      .filter(Boolean) as BigCommerceRestProduct[];
  };

  return {
    fetchProductsByIds,
  };
};
