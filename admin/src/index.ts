import { flattenObject, prefixPluginTranslations } from '@sensinum/strapi-utils';
import { en, getTradId, TranslationPath } from './translations';
import { PLUGIN_ID } from './pluginId';

export default {
  register(app: any) {
    const customFieldLabel: TranslationPath = 'customField.label';
    const customFieldDescription: TranslationPath = 'customField.label';

    app.customFields.register({
      name: 'product',
      pluginId: PLUGIN_ID,
      type: 'json',
      intlLabel: {
        id: getTradId(customFieldLabel),
      },
      intlDescription: {
        id: getTradId(customFieldDescription),
      },
      components: {
        Input: async () =>
          import(/* webpackChunkName: "product-input-component" */ './components/ProductInput'),
      },
      options: {
        // TODO?: specific shop pick
        // declare options here
      },
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    const trads = { en };

    return Promise.all(
      locales.map(async (locale: string) => {
        if (locale in trads) {
          const typedLocale = locale as keyof typeof trads;
          return trads[typedLocale]().then(({ default: trad }) => {
            return {
              data: prefixPluginTranslations(flattenObject(trad), PLUGIN_ID),
              locale,
            };
          });
        }
        return {
          data: prefixPluginTranslations(flattenObject({}), PLUGIN_ID),
          locale,
        };
      })
    );
  },
};
