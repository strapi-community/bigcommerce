import { getService } from '../getService';
import { Core } from '@strapi/strapi';
import { Services } from '../../services';

const getMockService = (): Record<string, jest.Mock> => ({
  someMethod: jest.fn(),
});

const getStrapiMock = (mockService: Record<string, jest.Mock> = getMockService()) => {
  const mockPlugin = {
    service: jest.fn().mockReturnValue(mockService),
  };

  return {
    plugin: jest.fn().mockReturnValue(mockPlugin),
  } as unknown as Core.Strapi;
};

describe('getService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the requested service', () => {
    const mockService = getMockService();
    const mockStrapi = getStrapiMock(mockService);
    const serviceName: keyof Services = 'cache';
    const result = getService(mockStrapi, serviceName);

    expect(mockStrapi.plugin).toHaveBeenCalledWith('shopify');
    expect(mockStrapi.plugin('shopify').service).toHaveBeenCalledWith(serviceName);
    expect(result).toBe(mockService);
  });

  it.each(['products', 'cache', 'big-commerce'] as const)(
    'should work with service name: %s',
    (serviceName) => {
      const mockService = getMockService();
      const mockStrapi = getStrapiMock(mockService);

      const result = getService(mockStrapi, serviceName);
      expect(mockStrapi.plugin('big-commerce').service).toHaveBeenCalledWith(serviceName);
      expect(result).toBe(mockService);
    }
  );
});
