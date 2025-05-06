import { Core } from '@strapi/strapi';
import { setupPermissions } from './permissions';
import { getService } from './utils';
import { getConfig } from './utils';
import { omit } from 'lodash';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  const adminService = getService(strapi, 'admin');
  const config = await adminService.getStore().get({
    key: 'config',
  });

  if (!config) {
    const envConfig = getConfig(strapi);
    await adminService.getStore().set({
      key: 'config',
      value: omit(envConfig, ['engine', 'connection']),
    });
  }

  await setupPermissions({ strapi });
};

export default bootstrap;
