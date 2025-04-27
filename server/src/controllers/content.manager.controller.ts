import { isLeft } from 'fp-ts/lib/Either';
import { z } from 'zod';
import { StrapiContext } from '../@types';
import type { RequestContext } from '../@types/koa';
import { getService } from '../utils';
import { validate } from '../validators/utils';

const getQueryVendorsValidator = (query: unknown) => {
  return validate(
    z
      .object({
        q: z.string().min(3),
      })
      .safeParse(query)
  );
};

const getContentManagerController = ({ strapi }: StrapiContext) => {
  const productService = getService(strapi, 'products');
  return {
    async getProducts(ctx: RequestContext) {
      const validator = getQueryVendorsValidator(ctx.query);
      if (isLeft(validator)) {
        return ctx.badRequest(validator.left.message, {
          issues: validator.left.issues,
        });
      }
      const { q } = validator.right;

      ctx.body = {
        products: await productService.searchProducts(q),
      };
    },
  };
};
export default getContentManagerController;
