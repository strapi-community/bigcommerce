import { FullPluginConfig, PluginConfig } from '../config/schema';
import { StrapiContext } from '../@types';
import { PLUGIN_ID } from '../const';

const CONFIG_KEY = 'config';
export const adminService = ({ strapi }: StrapiContext) => {
  const store = strapi.store({
    type: 'plugin',
    name: PLUGIN_ID,
  });
  return {
    getStore() {
      return store;
    },
    getConfig(): Promise<PluginConfig> {
      return store.get({
        key: CONFIG_KEY,
      });
    },
    async updateConfig(config: PluginConfig) {
      const oldConfig: FullPluginConfig = await this.getStore().get({
        key: CONFIG_KEY,
      });
      await this.getStore().set({
        key: CONFIG_KEY,
        value: {
          ...oldConfig,
          ...config,
        },
      });
      return config;
    },
  };
};

export default adminService;
export type AdminService = ReturnType<typeof adminService>;
