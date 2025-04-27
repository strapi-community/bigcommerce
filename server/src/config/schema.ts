import { z } from 'zod';

const baseConfig = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  accessToken: z.string().min(1),
  storeHash: z.string().min(1),
  channelId: z.number().int().positive().array().min(1),
  allowedCorsOrigins: z.string().array().optional().default([]),
  addressStore: z.string().url(),
});

const memoryEngine = baseConfig.extend({
  engine: z.literal('memory'),
});
export type MemoryEngine = z.infer<typeof memoryEngine>;

const redisEngine = baseConfig.extend({
  engine: z.literal('redis'),
  connection: z.object({
    host: z.string().min(1),
    port: z.number().int().positive(),
    db: z.number().int().positive(),
    password: z.string().optional(),
    username: z.string().optional(),
  }),
});

export type RedisEngine = z.infer<typeof redisEngine>;

export const schemaConfig = z.intersection(
  baseConfig,
  z.discriminatedUnion('engine', [memoryEngine, redisEngine])
);

export type PluginConfig = z.infer<typeof schemaConfig>;
