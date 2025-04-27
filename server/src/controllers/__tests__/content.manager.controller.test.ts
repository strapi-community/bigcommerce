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

      // Act
      const mockStrapi = getMockStrapi();
      const controller = contentManagerController({ strapi: mockStrapi });
      await controller.getProducts(mockCtx as RequestContext);

      // Assert
      expect(mockCtx.badRequest).toHaveBeenCalled();
    });

    it('should return bad request when query is missing', async () => {
      // Arrange
      const mockCtx = getMockCtx({
        query: {},
      });

      // Act
      const mockStrapi = getMockStrapi();
      const controller = contentManagerController({ strapi: mockStrapi });
      await controller.getProducts(mockCtx as RequestContext);

      // Assert
      expect(mockCtx.badRequest).toHaveBeenCalled();
    });
  });
});
