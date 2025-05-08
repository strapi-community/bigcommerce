# Strapi Plugin BigCommerce

A powerful Strapi plugin that seamlessly connects your Strapi application with BigCommerce stores through a user-friendly interface. It features a custom Shopify BigCommerce field, and efficient product synchronization capabilities. The plugin comes with built-in content types for store management, along with configurable caching mechanisms to optimize performance.


## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Required Configuration](#required-configuration)
  - [Example Configurations](#example-configurations)
- [Features](#features)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

- Node.js (Check Strapi's documentation for compatible versions)
- npm or yarn
- A running Strapi v4 project
- BigCommerce API credentials (`clientId`, `clientSecret`, `accessToken`, `storeHash`)
- At least one BigCommerce Channel ID
- URL for your BigCommerce Address Store API
- **Required BigCommerce API Token Scopes:**
    - `Products`: `read-only` (To read product data)
    - `Storefront API Tokens`: `manage` (To create tokens for storefront product searching)

## Installation

```bash
# Using npm
npm install @strapi-community/strapi-plugin-bigcommerce@latest

# Using yarn
yarn add @strapi-community/strapi-plugin-bigcommerce@latest
```

Then, rebuild your Strapi admin panel:

```bash
# Using npm
npm run build

# Using yarn
yarn build
```

## Configuration

### Required Configuration

You need to configure the plugin in your Strapi project's `./config/plugins.js` file (or `./config/plugins.ts` if using TypeScript).

The following fields are **required**:

- `clientId` (string): Your BigCommerce App Client ID.
- `clientSecret` (string): Your BigCommerce App Client Secret.
- `accessToken` (string): Your BigCommerce API Account Access Token.
- `storeHash` (string): Your BigCommerce Store Hash.
- `channelId` (array of numbers): An array containing at least one BigCommerce Channel ID.
- `addressStore` (string): The URL for your BigCommerce Address Store API endpoint.
- `encryptionKey` (string): A 32-character string used for encrypting sensitive data.
- `engine` (string): Specifies the storage engine for session data. Can be either `'memory'` or `'redis'`.
- `connection` (object, **required if `engine` is `'redis'`**): Contains Redis connection details:
    - `host` (string)
    - `port` (number)
    - `db` (number)
    - `password` (string, optional)
    - `username` (string, optional)

Optional fields:

- `allowedCorsOrigins` (array of strings): An array of allowed origins for CORS requests. Defaults to `[]`.

### Example Configurations

Create or update the file `./config/plugins.js` (or `.ts`):

**Using Memory Engine:**

```javascript
// ./config/plugins.js
module.exports = ({ env }) => ({
  // ... other plugin configurations
  'bigcommerce': {
    enabled: true,
    config: {
      clientId: env('BIGCOMMERCE_CLIENT_ID'),
      clientSecret: env('BIGCOMMERCE_CLIENT_SECRET'),
      accessToken: env('BIGCOMMERCE_ACCESS_TOKEN'),
      storeHash: env('BIGCOMMERCE_STORE_HASH'),
      channelId: [parseInt(env('BIGCOMMERCE_CHANNEL_ID', '1'), 10)], // Ensure it's an array of numbers
      addressStore: env('BIGCOMMERCE_ADDRESS_STORE_URL'),
      allowedCorsOrigins: ['http://localhost:3000'], // Optional
      engine: 'memory',
      encryptionKey: env('BIGCOMMERCE_ENCRYPTION_KEY'),
    },
  },
  // ... other plugin configurations
});
```

**Using Redis Engine:**

```javascript
// ./config/plugins.js
module.exports = ({ env }) => ({
  // ... other plugin configurations
  'bigcommerce': {
    enabled: true,
    config: {
      clientId: env('BIGCOMMERCE_CLIENT_ID'),
      clientSecret: env('BIGCOMMERCE_CLIENT_SECRET'),
      accessToken: env('BIGCOMMERCE_ACCESS_TOKEN'),
      storeHash: env('BIGCOMMERCE_STORE_HASH'),
      channelId: env.array('BIGCOMMERCE_CHANNEL_IDS', [1]).map(Number), // Example parsing env array
      addressStore: env('BIGCOMMERCE_ADDRESS_STORE_URL'),
      allowedCorsOrigins: [], // Optional
      engine: 'redis',
      connection: {
        host: env('REDIS_HOST', '127.0.0.1'),
        port: env.int('REDIS_PORT', 6379),
        db: env.int('REDIS_DB', 0),
        password: env('REDIS_PASSWORD', undefined),
        username: env('REDIS_USERNAME', undefined), // If using Redis ACLs
      },
      encryptionKey: env('BIGCOMMERCE_ENCRYPTION_KEY'),
    },
  },
  // ... other plugin configurations
});

```

Remember to add the corresponding environment variables to your `.env` file.

## Features

- Attach BigCommerce products to Strapi Content Types
- Map product data between BigCommerce and Strapi


## Contributing

Contributions are welcome! Please follow the standard guidelines for contributing to open-source projects.

## License

MIT
