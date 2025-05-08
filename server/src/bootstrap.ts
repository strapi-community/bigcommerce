import { Core } from '@strapi/strapi';
import { setupPermissions } from './permissions';
import { getService } from './utils';
import { getENVConfig } from './utils';
import { omit } from 'lodash';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  const adminService = getService(strapi, 'admin');
  try {
    await adminService.getConfig();
  } catch {
    const envConfig = getENVConfig(strapi);
    await adminService.updateConfig(omit(envConfig, ['engine', 'connection', 'encryptionKey']));
  }

  await setupPermissions({ strapi });
};

export default bootstrap;
