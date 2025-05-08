const en = {
  customField: {
    label: 'BigCommerce product',
    description: 'Add a bigcommerce product to your entry',
    product: {
      placeholder: 'Select a product',
    },
  },

  plugin: {
    section: {
      name: 'BigCommerce plugin',
      item: 'Shops',
    },
  },

  header: {
    settings: {
      tabTitle: 'BigCommerce',
      title: 'BigCommerce',
    },
  },

  form: {
    settings: {
      save: 'Save',
      success: {
        save: 'Settings saved successfully',
      },
      error: {
        validationMessage: 'Please check the form for errors',
      },
      clientId: {
        label: 'Client ID',
        placeholder: 'Enter your BigCommerce client ID',
      },
      clientSecret: {
        label: 'Client Secret',
        placeholder: 'Enter your BigCommerce client secret',
      },
      accessToken: {
        label: 'Access Token',
        placeholder: 'Enter your BigCommerce access token',
      },
      storeHash: {
        label: 'Store Hash',
        placeholder: 'Enter your BigCommerce store hash',
      },
      channelId: {
        label: 'Channel ID',
        placeholder: 'Enter your BigCommerce channel ID',
      },
      allowedCorsOrigins: {
        label: 'Allowed CORS Origins',
        placeholder: 'Enter allowed CORS origins (comma separated)',
      },
      addressStore: {
        label: 'Store Address',
        placeholder: 'Enter your BigCommerce store address',
      },
    },
    errors: {
      required: 'This field is required',
    }
  },
};

export default en;

export type EN = typeof en;
