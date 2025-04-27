import { Core } from '@strapi/strapi';
import { setupPermissions } from './permissions';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  await setupPermissions({ strapi });
};

export default bootstrap;
