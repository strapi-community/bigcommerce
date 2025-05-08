import crypto from 'crypto';
import { encryptConfig, decryptConfig } from '../encrypt';
import { PluginConfig } from '../../config/schema';

// Direct access to the encrypt/decrypt functions for testing
// These are internal functions from the encrypt.ts module
const encrypt = (text: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (text: string, key: string): string => {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

describe('encryption utilities', () => {
  const encryptionKey = '01234567890123456789012345678901'; // 32 characters

  // Sample mock config
  const getMockConfig = (): PluginConfig => ({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    accessToken: 'test-access-token',
    storeHash: 'test-store-hash',
    channelId: [1],
    allowedCorsOrigins: [],
    addressStore: 'http://localhost',
    encryptionKey: encryptionKey,
  });

  describe('encryptConfig', () => {
    it('should encrypt the sensitive fields in the config', () => {
      // Arrange
      const mockConfig = getMockConfig();

      // Act
      const encryptedConfig = encryptConfig(mockConfig, encryptionKey);

      // Assert
      expect(encryptedConfig).not.toBe(mockConfig); // Should return a new object
      expect(encryptedConfig.clientId).not.toBe(mockConfig.clientId);
      expect(encryptedConfig.clientSecret).not.toBe(mockConfig.clientSecret);
      expect(encryptedConfig.accessToken).not.toBe(mockConfig.accessToken);

      // Non-sensitive fields should remain the same
      expect(encryptedConfig.storeHash).toBe(mockConfig.storeHash);
      expect(encryptedConfig.channelId).toBe(mockConfig.channelId);
      expect(encryptedConfig.allowedCorsOrigins).toBe(mockConfig.allowedCorsOrigins);
      expect(encryptedConfig.addressStore).toBe(mockConfig.addressStore);

      // Encrypted data should be in the format of iv:encrypted
      expect(encryptedConfig.clientId).toContain(':');
      expect(encryptedConfig.clientSecret).toContain(':');
      expect(encryptedConfig.accessToken).toContain(':');
    });

    it('should handle null/undefined sensitive fields', () => {
      // Arrange
      const mockConfig = {
        ...getMockConfig(),
        clientId: undefined,
        clientSecret: null,
      } as unknown as PluginConfig;

      // Act
      const encryptedConfig = encryptConfig(mockConfig, encryptionKey);

      // Assert
      expect(encryptedConfig.clientId).toBe(undefined);
      expect(encryptedConfig.clientSecret).toBe(null);
      expect(encryptedConfig.accessToken).not.toBe(mockConfig.accessToken);
      expect(encryptedConfig.accessToken).toContain(':');
    });
  });

  describe('decryptConfig', () => {
    it('should decrypt the sensitive fields in the config', () => {
      // Arrange
      const mockConfig = getMockConfig();
      const encryptedConfig = encryptConfig(mockConfig, encryptionKey);

      // Act
      const decryptedConfig = decryptConfig(encryptedConfig, encryptionKey);

      // Assert
      expect(decryptedConfig).not.toBe(encryptedConfig); // Should return a new object
      expect(decryptedConfig.clientId).toBe(mockConfig.clientId);
      expect(decryptedConfig.clientSecret).toBe(mockConfig.clientSecret);
      expect(decryptedConfig.accessToken).toBe(mockConfig.accessToken);
    });

    it('should handle null/undefined sensitive fields', () => {
      // Arrange
      const mockConfig = {
        ...getMockConfig(),
        clientId: undefined,
        clientSecret: null,
      } as unknown as PluginConfig;
      const encryptedConfig = encryptConfig(mockConfig, encryptionKey);

      // Act
      const decryptedConfig = decryptConfig(encryptedConfig, encryptionKey);

      // Assert
      expect(decryptedConfig.clientId).toBe(undefined);
      expect(decryptedConfig.clientSecret).toBe(null);
      expect(decryptedConfig.accessToken).toBe(mockConfig.accessToken);
    });
  });

  describe('encrypt-decrypt integration', () => {
    it('should successfully decrypt what was encrypted', () => {
      // Arrange
      const testKey = '01234567890123456789012345678901'; // 32 characters
      const mockConfig = getMockConfig();

      // Act
      const encryptedConfig = encryptConfig(mockConfig, testKey);
      const decryptedConfig = decryptConfig(encryptedConfig, testKey);

      // Assert - should get back the original values
      expect(decryptedConfig.clientId).toBe(mockConfig.clientId);
      expect(decryptedConfig.clientSecret).toBe(mockConfig.clientSecret);
      expect(decryptedConfig.accessToken).toBe(mockConfig.accessToken);

      // Verify encrypted values are different from original and have the IV:encrypted format
      expect(encryptedConfig.clientId).not.toBe(mockConfig.clientId);
      expect(encryptedConfig.clientId).toContain(':');

      expect(encryptedConfig.clientSecret).not.toBe(mockConfig.clientSecret);
      expect(encryptedConfig.clientSecret).toContain(':');

      expect(encryptedConfig.accessToken).not.toBe(mockConfig.accessToken);
      expect(encryptedConfig.accessToken).toContain(':');
    });
  });

  describe('actual crypto operations', () => {
    it('should encrypt and decrypt a value using real crypto operations', () => {
      // Arrange
      const testValue = 'sensitive-data-to-encrypt';
      const testKey = '01234567890123456789012345678901'; // 32 characters

      // Act - encrypt the value
      const encrypted = encrypt(testValue, testKey);

      // Assert - verify encrypted format
      expect(encrypted).not.toBe(testValue);
      expect(encrypted).toContain(':');

      const [ivHex, encryptedHex] = encrypted.split(':');
      expect(ivHex).toBeTruthy();
      expect(encryptedHex).toBeTruthy();
      expect(ivHex.length).toBe(32); // 16 bytes = 32 hex chars
      expect(encryptedHex.length).toBeGreaterThan(0);

      // Act - decrypt the value
      const decrypted = decrypt(encrypted, testKey);

      // Assert - verify decryption works
      expect(decrypted).toBe(testValue);
    });

    it('should correctly encrypt and decrypt a full config object using real operations', () => {
      // Arrange
      const testKey = '01234567890123456789012345678901'; // 32 characters
      const sensitiveConfig: PluginConfig = {
        clientId: 'real-client-id-123456',
        clientSecret: 'real-client-secret-abcdef',
        accessToken: 'real-access-token-xyz789',
        storeHash: 'store-abc123',
        channelId: [123, 456],
        allowedCorsOrigins: ['https://example.com'],
        addressStore: 'https://store.example.com',
        encryptionKey: testKey,
      };

      // Act
      const encryptedConfig = encryptConfig(sensitiveConfig, testKey);

      // Assert - check encrypted values
      expect(encryptedConfig.clientId).not.toBe(sensitiveConfig.clientId);
      expect(encryptedConfig.clientSecret).not.toBe(sensitiveConfig.clientSecret);
      expect(encryptedConfig.accessToken).not.toBe(sensitiveConfig.accessToken);

      // Verify encrypted format (iv:encrypted)
      const clientIdParts = encryptedConfig.clientId.split(':');
      expect(clientIdParts.length).toBe(2);
      expect(clientIdParts[0].length).toBe(32); // IV is 16 bytes = 32 hex chars

      // Act - decrypt the config
      const decryptedConfig = decryptConfig(encryptedConfig, testKey);

      // Assert - verify original values are restored
      expect(decryptedConfig.clientId).toBe(sensitiveConfig.clientId);
      expect(decryptedConfig.clientSecret).toBe(sensitiveConfig.clientSecret);
      expect(decryptedConfig.accessToken).toBe(sensitiveConfig.accessToken);
      expect(decryptedConfig.storeHash).toBe(sensitiveConfig.storeHash);
      expect(decryptedConfig.channelId).toEqual(sensitiveConfig.channelId);
      expect(decryptedConfig.allowedCorsOrigins).toEqual(sensitiveConfig.allowedCorsOrigins);
      expect(decryptedConfig.addressStore).toBe(sensitiveConfig.addressStore);
    });
  });
});
