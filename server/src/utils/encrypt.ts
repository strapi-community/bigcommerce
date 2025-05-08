import crypto from 'crypto';
import { PluginConfig } from '../config/schema';

const algorithm = 'aes-256-cbc';

const encrypt = (text: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (text: string, key: string): string => {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const encryptConfig = <C extends PluginConfig>(config: C, encryptionKey: string): C => {
  const { accessToken, clientSecret, clientId } = config;
  return {
    ...config,
    accessToken: accessToken ? encrypt(accessToken, encryptionKey) : accessToken,
    clientSecret: clientSecret ? encrypt(clientSecret, encryptionKey) : clientSecret,
    clientId: clientId ? encrypt(clientId, encryptionKey) : clientId,
  };
};

export const decryptConfig = <C extends PluginConfig>(config: C, encryptionKey: string): C => {
  const { accessToken, clientSecret, clientId } = config;
  return {
    ...config,
    accessToken: accessToken ? decrypt(accessToken, encryptionKey) : accessToken,
    clientSecret: clientSecret ? decrypt(clientSecret, encryptionKey) : clientSecret,
    clientId: clientId ? decrypt(clientId, encryptionKey) : clientId,
  };
};
