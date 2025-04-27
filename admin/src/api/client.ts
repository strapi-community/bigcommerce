import { getFetchClient } from '@strapi/strapi/admin';
import { once } from 'lodash';
import { z } from 'zod';
import { PLUGIN_ID as URL_PREFIX } from '../pluginId';
import { ShopProductSchema, shopProductSchema } from '../validators/shop.validator';

export type ApiClient = ReturnType<typeof getApiClient>;

export const getApiClient = once((fetch: ReturnType<typeof getFetchClient>) => ({
  getReadShopProductsIndex: ({ query }: { query: string }) => [URL_PREFIX, query, 'products'],
  readShopProducts: ({ query }: { query: string }): Promise<Array<ShopProductSchema>> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    return fetch
      .get(`/${URL_PREFIX}/content-manager/products?${searchParams.toString()}`)
      .then(({ data }) => z.object({ products: shopProductSchema.array() }).parse(data))
      .then(({ products }) => products);
  },
}));
