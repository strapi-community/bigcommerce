import { getConfig } from '../getConfig';
import { Core } from '@strapi/strapi';
import { PluginConfig, RedisEngine } from '../../config/schema';

const getMockConfig = (): PluginConfig => ({
  engine: 'memory',
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  accessToken: 'test-access-token',
  storeHash: 'test-store-hash',
  channelId: [1],
  allowedCorsOrigins: [],
  addressStore: 'http://localhost',
});

const getStrapiMock = (mockConfig: PluginConfig = getMockConfig()) => {
  return {
    config: {
      get: jest.fn().mockReturnValue(mockConfig),
    },
  } as unknown as Core.Strapi;
};

const isRedisEngine = (config: PluginConfig): config is RedisEngine & { host: string } => {
  return config.engine === 'redis';
};

describe('getConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the plugin configuration', () => {
    // Arrange
    const mockConfig = getMockConfig();
    const mockStrapi = getStrapiMock(mockConfig);

    // Act
    const result = getConfig(mockStrapi);

    // Assert
    expect(mockStrapi.config.get).toHaveBeenCalledWith('plugin::big-commerce');
    expect(result).toBe(mockConfig);
  });

  it('should return the correct configuration structure', () => {
    // Arrange
    const mockConfig = getMockConfig();
    const mockStrapi = getStrapiMock(mockConfig);

    // Act
    const result = getConfig(mockStrapi);

    // Assert
    expect(result).toHaveProperty('addressStore');
    expect(result).toHaveProperty('engine');
    expect(result.engine).toBe('memory');
  });

  it('should work with redis engine configuration', () => {
    // Arrange
    const redisConfig: PluginConfig = {
      engine: 'redis',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      accessToken: 'test-access-token',
      storeHash: 'test-store-hash',
      channelId: [1],
      allowedCorsOrigins: [],
      addressStore: 'http://localhost',
      connection: {
        host: 'localhost',
        port: 6379,
        db: 0,
        password: 'password',
        username: 'user',
      },
    } as PluginConfig;
    const mockStrapi = getStrapiMock(redisConfig);

    // Act
    const result = getConfig(mockStrapi);

    // Assert
    expect(result).toHaveProperty('addressStore');
    expect(result).toHaveProperty('engine');
    expect(result.engine).toBe('redis');

    if (isRedisEngine(result)) {
      // Assert
      expect(result.connection).toHaveProperty('host');
      expect(result.connection).toHaveProperty('port');
      expect(result.connection).toHaveProperty('db');
      expect(result.connection).toHaveProperty('password');
      expect(result.connection).toHaveProperty('username');
    }
  });
});
