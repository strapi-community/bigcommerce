import { getGQLClient } from '../../clients/gql.client';
import type { StrapiContext } from '../../../@types';
import type { BigCommerceGqlSearchProductsResponse, BigCommerceGqlProduct } from '../../@types';
import { LRUCache } from 'lru-cache';

const mockLRUCacheInstance = {
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock('lru-cache', () => ({
  LRUCache: jest.fn().mockImplementation(() => mockLRUCacheInstance),
}));

const mockConfig = {
  storeHash: 'test-store',
  accessToken: 'test-token',
  allowedCorsOrigins: ['http://localhost:3000'],
};

function createStrapiMock(config: any = mockConfig) {
  return {
    config: { get: jest.fn().mockReturnValue(config) },
    log: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    },
  } as unknown as StrapiContext['strapi'];
}

describe('gql.client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    // Arrange
    const strapi = createStrapiMock();

    // Act
    const client = getGQLClient({ strapi });

    // Assert
    expect(client).toBeDefined();
    expect(client.searchProductsByName).toBeInstanceOf(Function);
  });

  describe('Storefront Token Handling', () => {
    it('should create a new storefront token if not cached', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const strapi = createStrapiMock();
      const client = getGQLClient({ strapi });
      const mockTokenResponse = { data: { token: 'new-sf-token' } };
      mockLRUCacheInstance.get.mockReturnValue(undefined);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);
      const mockGqlResponse: BigCommerceGqlSearchProductsResponse = {
        data: { site: { search: { searchProducts: { products: { edges: [] } } } } },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGqlResponse,
      } as Response);
      // Act
      await client.searchProductsByName('test');

      // Assert
      const expectedCacheKey = `${mockConfig.storeHash}|${mockConfig.allowedCorsOrigins.sort().join(',')}`;
      expect(mockLRUCacheInstance.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(`/stores/${mockConfig.storeHash}/v3/storefront/api-token`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'X-Auth-Token': mockConfig.accessToken }),
        })
      );

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(`/graphql`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: `Bearer new-sf-token` }),
        })
      );

      expect(mockLRUCacheInstance.set).toHaveBeenCalledWith(
        expectedCacheKey,
        expect.objectContaining({ token: 'new-sf-token' })
      );
      mockFetch.mockRestore();
    });

    it('should use cached storefront token if valid', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const strapi = createStrapiMock();
      const client = getGQLClient({ strapi });
      const cachedToken = {
        token: 'cached-sf-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      };
      const expectedCacheKey = `${mockConfig.storeHash}|${mockConfig.allowedCorsOrigins.sort().join(',')}`;
      mockLRUCacheInstance.get.mockReturnValue(cachedToken);
      const mockGqlResponse: BigCommerceGqlSearchProductsResponse = {
        data: {
          site: {
            search: {
              searchProducts: {
                products: {
                  edges: [],
                },
              },
            },
          },
        },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGqlResponse,
      } as Response);

      // Act
      await client.searchProductsByName('test');

      // Assert
      expect(mockLRUCacheInstance.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only the GQL fetch
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/graphql`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: `Bearer ${cachedToken.token}` }),
        })
      );
      expect(mockLRUCacheInstance.set).not.toHaveBeenCalled();
      mockFetch.mockRestore();
    });

    it('should create a new token if cached token is expired', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const strapi = createStrapiMock();
      const client = getGQLClient({ strapi });
      const expiredToken = {
        token: 'expired-sf-token',
        expiresAt: Math.floor(Date.now() / 1000) - 60, // Expired 1 minute ago
      };
      const expectedCacheKey = `${mockConfig.storeHash}|${mockConfig.allowedCorsOrigins.sort().join(',')}`;
      mockLRUCacheInstance.get.mockReturnValue(expiredToken);

      const mockTokenResponse = { data: { token: 'new-sf-token-after-expiry' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const mockGqlResponse: BigCommerceGqlSearchProductsResponse = {
        data: { site: { search: { searchProducts: { products: { edges: [] } } } } },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGqlResponse,
      } as Response);

      // Act
      await client.searchProductsByName('test');

      // Assert
      expect(mockLRUCacheInstance.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Token creation + GQL request
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/stores/${mockConfig.storeHash}/v3/storefront/api-token`),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/graphql`),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: `Bearer new-sf-token-after-expiry` }),
        })
      );
      expect(mockLRUCacheInstance.set).toHaveBeenCalledWith(
        expectedCacheKey,
        expect.objectContaining({ token: 'new-sf-token-after-expiry' })
      );
      mockFetch.mockRestore();
    });

    it('should throw error if token creation returns invalid JSON', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const strapi = createStrapiMock();
      const client = getGQLClient({ strapi });
      const invalidTokenResponse = { data: {} }; // Missing token field
      mockLRUCacheInstance.get.mockReturnValue(undefined);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidTokenResponse,
      } as Response);

      // Act & Assert
      await expect(client.searchProductsByName('test')).rejects.toThrow(
        'Invalid response from Storefront token endpoint'
      );
      const expectedCacheKey = `${mockConfig.storeHash}|${mockConfig.allowedCorsOrigins.sort().join(',')}`;
      expect(mockLRUCacheInstance.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/stores/${mockConfig.storeHash}/v3/storefront/api-token`),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockLRUCacheInstance.set).not.toHaveBeenCalled();
      mockFetch.mockRestore();
    });

    it('should use empty array if allowedCorsOrigins is missing in config', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const configWithoutOrigins = { ...mockConfig };
      delete (configWithoutOrigins as any).allowedCorsOrigins;
      const strapi = createStrapiMock(configWithoutOrigins);
      const client = getGQLClient({ strapi });
      const mockTokenResponse = { data: { token: 'token-no-origins' } };
      mockLRUCacheInstance.get.mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const mockGqlResponse: BigCommerceGqlSearchProductsResponse = {
        data: { site: { search: { searchProducts: { products: { edges: [] } } } } },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGqlResponse,
      } as Response);

      const expectedCacheKey = `${configWithoutOrigins.storeHash}|`;

      // Act
      await client.searchProductsByName('test');

      // Assert
      expect(mockLRUCacheInstance.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(
          `/stores/${configWithoutOrigins.storeHash}/v3/storefront/api-token`
        ),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'X-Auth-Token': configWithoutOrigins.accessToken }),
          body: expect.stringContaining('"allowed_cors_origins":[]'),
        })
      );

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(`/graphql`),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: `Bearer token-no-origins` }),
        })
      );

      expect(mockLRUCacheInstance.set).toHaveBeenCalledWith(
        expectedCacheKey,
        expect.objectContaining({ token: 'token-no-origins' })
      );
      mockFetch.mockRestore();
    });

    it('should create a new token if cached token is near expiry (within 60s)', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const strapi = createStrapiMock();
      const client = getGQLClient({ strapi });
      const nearExpiryToken = {
        token: 'near-expiry-sf-token',
        expiresAt: Math.floor(Date.now() / 1000) + 50, // Expires in 50 seconds
      };
      const expectedCacheKey = `${mockConfig.storeHash}|${mockConfig.allowedCorsOrigins.sort().join(',')}`;
      mockLRUCacheInstance.get.mockReturnValue(nearExpiryToken);

      const mockTokenResponse = { data: { token: 'new-sf-token-after-near-expiry' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const mockGqlResponse: BigCommerceGqlSearchProductsResponse = {
        data: { site: { search: { searchProducts: { products: { edges: [] } } } } },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGqlResponse,
      } as Response);

      // Act
      await client.searchProductsByName('test');

      // Assert
      expect(mockLRUCacheInstance.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/stores/${mockConfig.storeHash}/v3/storefront/api-token`),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/graphql`),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer new-sf-token-after-near-expiry`,
          }),
        })
      );
      expect(mockLRUCacheInstance.set).toHaveBeenCalledWith(
        expectedCacheKey,
        expect.objectContaining({ token: 'new-sf-token-after-near-expiry' })
      );
      mockFetch.mockRestore();
    });
  });

  describe('searchProductsByName', () => {
    const searchTerm = 'Gadget';
    const mockProductNodes: Partial<BigCommerceGqlProduct>[] = [
      { entityId: 101, name: 'Mega Gadget' },
      { entityId: 102, name: 'Mini Gadget' },
    ];
    const mockGqlResponse: BigCommerceGqlSearchProductsResponse = {
      data: {
        site: {
          search: {
            searchProducts: {
              products: {
                edges: mockProductNodes.map((node) => ({ node: node as any })),
              },
            },
          },
        },
      },
    };

    it('should fetch and map products correctly on success', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const strapi = createStrapiMock();
      const client = getGQLClient({ strapi });
      const cachedToken = {
        token: 'valid-cached-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      mockLRUCacheInstance.get.mockReturnValue(cachedToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGqlResponse,
      } as Response);

      // Act
      const results = await client.searchProductsByName(searchTerm);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://store-${mockConfig.storeHash}.mybigcommerce.com/graphql`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: `Bearer valid-cached-token` }),
          body: expect.stringContaining(`"searchTerm":"${searchTerm}"`),
        })
      );
      expect(results).toEqual([
        { productId: 101, name: 'Mega Gadget', id: 101 },
        { productId: 102, name: 'Mini Gadget', id: 102 },
      ]);
      expect(strapi.log.error).not.toHaveBeenCalled();
      mockFetch.mockRestore();
    });

    it('should throw and log error on GQL network error', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const strapi = createStrapiMock();
      const client = getGQLClient({ strapi });
      const cachedToken = {
        token: 'valid-cached-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      mockLRUCacheInstance.get.mockReturnValue(cachedToken);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      // Act & Assert
      await expect(client.searchProductsByName(searchTerm)).rejects.toThrow(
        'BigCommerce GQL API error: 500 Internal Server Error'
      );
      expect(strapi.log.error).toHaveBeenCalledTimes(2);
      expect(strapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('BigCommerce GQL API network error'),
        expect.anything()
      );
      expect(strapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('BigCommerce GQL request failed'),
        expect.anything()
      );
      mockFetch.mockRestore();
    });

    it('should throw and log error on GQL response error', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const strapi = createStrapiMock();
      const client = getGQLClient({ strapi });
      const cachedToken = {
        token: 'valid-cached-token',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      mockLRUCacheInstance.get.mockReturnValue(cachedToken);
      const errorResponse = {
        errors: [{ message: 'Invalid search term' }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => errorResponse,
      } as Response);

      // Act & Assert
      await expect(client.searchProductsByName(searchTerm)).rejects.toThrow(
        `BigCommerce GQL error: ${JSON.stringify(errorResponse.errors)}`
      );
      expect(strapi.log.error).toHaveBeenCalledTimes(2);
      expect(strapi.log.error).toHaveBeenCalledWith(
        'BigCommerce GQL API returned errors',
        expect.objectContaining({ errors: errorResponse.errors })
      );
      expect(strapi.log.error).toHaveBeenCalledWith(
        expect.stringContaining('BigCommerce GQL request failed'),
        expect.anything()
      );
      mockFetch.mockRestore();
    });

    it('should throw and log error if token creation fails', async () => {
      // Arrange
      const mockFetch = jest.spyOn(global, 'fetch');
      const strapi = createStrapiMock();
      const client = getGQLClient({ strapi });
      mockLRUCacheInstance.get.mockReturnValue(undefined);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      // Act & Assert
      await expect(client.searchProductsByName(searchTerm)).rejects.toThrow(
        'Failed to create Storefront token: 401 Unauthorized'
      );
      mockFetch.mockRestore();
    });
  });
});
