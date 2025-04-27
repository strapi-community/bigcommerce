import type { StrapiContext } from '../@types';
import { getService } from '../utils';
import { ProductService } from './@types';

export type Product = number;
const productsService = ({ strapi }: StrapiContext): ProductService => {
  const bigCommerceService = getService(strapi, 'big-commerce');

  return {
    async getProductsById(productIds: Product[]) {
      const products = await bigCommerceService.getRestClient().fetchProductsByIds(productIds);
      return new Map(products.map((p) => [p.id, p]));
    },
    async searchProducts(query: string) {
      return bigCommerceService.getGQLClient().searchProductsByName(query);
    },
  };
};

export default productsService;
export type ProductsService = ReturnType<typeof productsService>;
