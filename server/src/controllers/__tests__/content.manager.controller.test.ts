import { StrapiContext } from '../../@types';
import type { RequestContext } from '../../@types/koa';
import contentManagerController from '../content.manager.controller';
import * as utils from '../../utils';

// Mock dependencies
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  __esModule: true,
}));

const getMockStrapi = (searchProductsMock?: jest.Mock) =>
  ({
    plugin: jest.fn().mockReturnValue({
      service: jest.fn().mockReturnValue({
        searchProducts: searchProductsMock ?? jest.fn().mockResolvedValue([]),
      }),
    }),
  }) as unknown as StrapiContext['strapi'];

const getMockCtx = ({
  body,
  query,
  badRequest,
}: { body?: any; query?: any; badRequest?: jest.Mock } = {}) => {
  return {
    body: body ?? undefined,
    query: query ?? {},
    badRequest: badRequest ?? jest.fn(),
  } as unknown as RequestContext;
};

describe('content.manager.controller', () => {
  beforeEach(jest.restoreAllMocks);

  describe('getProducts', () => {
    it('should return products when valid query is provided', async () => {
      // Arrange
      const mockProducts = [{ id: 1, title: 'Product 1' }];
      jest.spyOn(utils, 'getService').mockReturnValue({
        searchProducts: jest.fn().mockResolvedValue(mockProducts),
      } as unknown as ReturnType<typeof utils.getService>);

      const mockCtx = getMockCtx({
        query: {
          q: 'test',
        },
      });

      // Act
      const mockStrapi = getMockStrapi(jest.fn().mockResolvedValue(mockProducts));
      const controller = contentManagerController({ strapi: mockStrapi });
      await controller.getProducts(mockCtx as RequestContext);

      // Assert
      expect(mockCtx.body).toEqual({ products: mockProducts });
    });

    it('should return bad request when query is too short', async () => {
      // Arrange
      const mockCtx = getMockCtx({
        query: {
          q: 't',
        },
      });
      const mockBadRequest = jest.fn();
      const mockCtxWithBadRequest = getMockCtx({
        query: { q: 't' },
        badRequest: mockBadRequest,
      });

      // Act
      const mockStrapi = getMockStrapi();
      const controller = contentManagerController({ strapi: mockStrapi });
      await controller.getProducts(mockCtxWithBadRequest as RequestContext);

      // Assert
      expect(mockBadRequest).toHaveBeenCalled();
      expect(mockBadRequest).toHaveBeenCalledWith(
        expect.stringContaining('must contain at least 3 character'),
        expect.objectContaining({ issues: expect.anything() })
      );
    });

    it('should return bad request when query is missing', async () => {
      // Arrange
      const mockBadRequest = jest.fn();
      const mockCtx = getMockCtx({
        query: {},
        badRequest: mockBadRequest,
      });

      // Act
      const mockStrapi = getMockStrapi();
      const controller = contentManagerController({ strapi: mockStrapi });
      await controller.getProducts(mockCtx as RequestContext);

      // Assert
      expect(mockBadRequest).toHaveBeenCalled();
      expect(mockBadRequest).toHaveBeenCalledWith(
        expect.stringContaining('Required'),
        expect.objectContaining({ issues: expect.anything() })
      );
    });

    it('should call productService.searchProducts with the correct query parameter', async () => {
      // Arrange
      const mockSearchProducts = jest.fn().mockResolvedValue([]);
      jest.spyOn(utils, 'getService').mockReturnValue({
        searchProducts: mockSearchProducts,
      } as unknown as ReturnType<typeof utils.getService>);

      const mockCtx = getMockCtx({
        query: {
          q: 'test-query',
        },
      });

      // Act
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await controller.getProducts(mockCtx as RequestContext);

      // Assert
      expect(mockSearchProducts).toHaveBeenCalledWith('test-query');
    });

    it('should handle errors from productService.searchProducts', async () => {
      // Arrange
      const mockError = new Error('Service error');
      const mockSearchProducts = jest.fn().mockRejectedValue(mockError);
      jest.spyOn(utils, 'getService').mockReturnValue({
        searchProducts: mockSearchProducts,
      } as unknown as ReturnType<typeof utils.getService>);

      const mockCtx = getMockCtx({
        query: {
          q: 'test',
        },
      });

      // Act & Assert
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await expect(controller.getProducts(mockCtx as RequestContext)).rejects.toThrow(
        'Service error'
      );
    });

    it('should return bad request when q is not a string', async () => {
      // Arrange
      const mockBadRequest = jest.fn();
      const mockCtx = getMockCtx({
        query: {
          q: 123, // Non-string value
        },
        badRequest: mockBadRequest,
      });

      // Act
      const mockStrapi = getMockStrapi();
      const controller = contentManagerController({ strapi: mockStrapi });
      await controller.getProducts(mockCtx as RequestContext);

      // Assert
      expect(mockBadRequest).toHaveBeenCalled();
      expect(mockBadRequest).toHaveBeenCalledWith(
        expect.stringContaining('Expected string'),
        expect.objectContaining({ issues: expect.anything() })
      );
    });

    it('should return empty array when no products are found', async () => {
      // Arrange
      const emptyProducts: any[] = [];
      jest.spyOn(utils, 'getService').mockReturnValue({
        searchProducts: jest.fn().mockResolvedValue(emptyProducts),
      } as unknown as ReturnType<typeof utils.getService>);

      const mockCtx = getMockCtx({
        query: {
          q: 'no-results-query',
        },
      });

      // Act
      const mockStrapi = getMockStrapi(jest.fn().mockResolvedValue(emptyProducts));
      const controller = contentManagerController({ strapi: mockStrapi });
      await controller.getProducts(mockCtx as RequestContext);

      // Assert
      expect(mockCtx.body).toEqual({ products: [] });
    });

    it('should handle exactly minimum length query (3 characters)', async () => {
      // Arrange
      const mockProducts = [{ id: 1, title: 'Product 1' }];
      const mockSearchProducts = jest.fn().mockResolvedValue(mockProducts);
      jest.spyOn(utils, 'getService').mockReturnValue({
        searchProducts: mockSearchProducts,
      } as unknown as ReturnType<typeof utils.getService>);

      const mockCtx = getMockCtx({
        query: {
          q: 'abc', // Exactly 3 characters
        },
      });

      // Act
      const controller = contentManagerController({ strapi: getMockStrapi() });
      await controller.getProducts(mockCtx as RequestContext);

      // Assert
      expect(mockSearchProducts).toHaveBeenCalledWith('abc');
      expect(mockCtx.body).toEqual({ products: mockProducts });
    });
  });
});
