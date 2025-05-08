import { snakeCase } from 'lodash';
import { StrapiContext } from '../@types';
import { FullPluginConfig, PluginConfig } from '../config/schema';
import { PLUGIN_ID } from '../const';
import { getENVConfig } from '../utils';
import { decryptConfig, encryptConfig } from '../utils/encrypt';

const CONFIG_KEY = 'store_config';
export const adminService = ({ strapi }: StrapiContext) => {
  const { encryptionKey } = getENVConfig(strapi);
  const store = strapi.store({
    type: 'plugin',
    name: snakeCase(PLUGIN_ID),
  });
  return {
    getStore() {
      return store;
    },
    async getConfig(): Promise<PluginConfig> {
      const config = await store.get({
        key: CONFIG_KEY,
      });
      return decryptConfig(config, encryptionKey);
    },
    async updateConfig(config: PluginConfig) {
      const oldConfig: FullPluginConfig = await this.getStore().get({
        key: CONFIG_KEY,
      });
      await this.getStore().set({
        key: CONFIG_KEY,
        value: encryptConfig(
          {
            ...oldConfig,
            ...config,
          },
          encryptionKey
        ),
      });
      return config;
    },
  };
};

export default adminService;
export type AdminService = ReturnType<typeof adminService>;
