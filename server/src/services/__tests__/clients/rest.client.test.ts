import { getRestClient } from '../../clients/rest.client';
import type { StrapiContext } from '../../../@types';
import type { BigCommerceRestProduct } from '../../@types';

describe('rest.client', () => {
  const mockConfig = {
    accessToken: 'token',
    storeHash: 'store',
  };

  const mockAdminService = {
    getConfig: jest.fn().mockResolvedValue(mockConfig),
    updateConfig: jest.fn(),
    getStore: jest.fn(),
  };

  function createStrapiMock({ cacheService }: { cacheService: any }) {
    return {
      plugin: jest.fn().mockReturnValue({
        service: jest.fn((name: string) => {
          if (name === 'cache') return cacheService;
          if (name === 'admin') return mockAdminService;
          throw new Error('Unknown service: ' + name);
        }),
      }),
    } as unknown as StrapiContext['strapi'];
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array if no ids are provided', async () => {
    // Arrange
    const cacheService = { get: jest.fn(), set: jest.fn() };
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([]);

    // Assert
    expect(result).toEqual([]);
    expect(cacheService.get).not.toHaveBeenCalled();
  });

  it('returns cached products if all are cached', async () => {
    // Arrange
    const cachedProducts = [
      { id: 1, name: 'A', sku: 'a' },
      { id: 2, name: 'B', sku: 'b' },
    ];
    const cacheService = {
      get: jest
        .fn()
        .mockResolvedValueOnce(cachedProducts[0])
        .mockResolvedValueOnce(cachedProducts[1]),
      set: jest.fn(),
    };
    const fetchSpy = jest.spyOn(global, 'fetch' as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([1, 2]);

    // Assert
    expect(cacheService.get).toHaveBeenCalledTimes(2);
    expect(result).toEqual(cachedProducts);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('fetches missing products from API and caches them', async () => {
    // Arrange
    const cacheService = {
      get: jest
        .fn()
        .mockResolvedValueOnce({ id: 1, name: 'A', sku: 'a' })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
      set: jest.fn(),
    };
    const apiProducts: BigCommerceRestProduct[] = [
      { id: 2, name: 'B', sku: 'b' },
      { id: 3, name: 'C', sku: 'c' },
    ];
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: apiProducts }),
    } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([1, 2, 3]);

    // Assert
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(cacheService.set).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      { id: 1, name: 'A', sku: 'a' },
      { id: 2, name: 'B', sku: 'b' },
      { id: 3, name: 'C', sku: 'c' },
    ]);
    fetchSpy.mockRestore();
  });

  it('throws if fetch fails', async () => {
    // Arrange
    const cacheService = { get: jest.fn().mockResolvedValueOnce(undefined), set: jest.fn() };
    const fetchSpy = jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act & Assert
    await expect(client.fetchProductsByIds([1])).rejects.toThrow(
      'BigCommerce REST API error: 500 Server Error'
    );
    fetchSpy.mockRestore();
  });

  it('returns products in the order of input ids', async () => {
    // Arrange
    const cacheService = {
      get: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ id: 1, name: 'A', sku: 'a' }),
      set: jest.fn(),
    };
    const apiProducts: BigCommerceRestProduct[] = [{ id: 2, name: 'B', sku: 'b' }];
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: apiProducts }),
    } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([2, 1]);

    // Assert
    expect(result.map((p) => p.id)).toEqual([2, 1]);
    fetchSpy.mockRestore();
  });

  it('handles partial cache hits', async () => {
    // Arrange
    const cacheService = {
      get: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ id: 2, name: 'B', sku: 'b' })
        .mockResolvedValueOnce(undefined),
      set: jest.fn(),
    };
    const apiProducts: BigCommerceRestProduct[] = [
      { id: 1, name: 'A', sku: 'a' },
      { id: 3, name: 'C', sku: 'c' },
    ];
    const fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: apiProducts }),
    } as any);
    const strapi = createStrapiMock({ cacheService });
    const client = getRestClient({ strapi });

    // Act
    const result = await client.fetchProductsByIds([1, 2, 3]);

    // Assert
    expect(result.map((p) => p.id)).toEqual([1, 2, 3]);
    expect(cacheService.set).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
  });
});
