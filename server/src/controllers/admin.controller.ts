import { z } from 'zod';
import { StrapiContext } from '../@types';
import { getService } from '../utils';
import type { RequestContext } from '../@types/koa';
import { pluginConfig } from '../config/schema';
import { validate } from '../validators/utils';
import { isLeft } from 'fp-ts/lib/Either';

const adminController = ({ strapi }: StrapiContext) => {
  const adminService = getService(strapi, 'admin');
  const partialHideValue = (value: string) =>
    `${value.substring(0, 3)}*****${value.substring(value.length - 1)}`;

  return {
    async getConfig(ctx: RequestContext) {
      const adminConfig = await adminService.getConfig();
      ctx.body = {
        ...adminConfig,
        clientId: partialHideValue(adminConfig.clientId),
        clientSecret: partialHideValue(adminConfig.clientSecret),
        accessToken: partialHideValue(adminConfig.accessToken),
      };
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
