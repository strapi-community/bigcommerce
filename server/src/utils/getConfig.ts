import { Core } from '@strapi/strapi';
import { FullPluginConfig } from '../config/schema';

export const getConfig = (strapi: Core.Strapi): FullPluginConfig =>
  strapi.config.get('plugin::big-commerce');
