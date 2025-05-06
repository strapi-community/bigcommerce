import { StrapiContext } from '../@types';
import { getService } from '../utils';
import type { RequestContext } from '../@types/koa';
import { pluginConfig } from 'src/config/schema';
import { validate } from 'src/validators/utils';
import { isLeft } from 'fp-ts/lib/Either';
const adminController = ({ strapi }: StrapiContext) => {
  const adminService = getService(strapi, 'admin');
  return {
    async getConfig(ctx: RequestContext) {
      ctx.body = await adminService.getConfig();
      return ctx;
    },
    async updateConfig(ctx: RequestContext) {
      const config = validate(pluginConfig.safeParse(ctx.request.body));

      if (isLeft(config)) {
        return ctx.badRequest(config.left.message, {
          issues: config.left.issues,
        });
      }

      ctx.body = await adminService.updateConfig(config.right);
      return ctx;
    },
  };
};

export default adminController;
export type AdminController = ReturnType<typeof adminController>;
