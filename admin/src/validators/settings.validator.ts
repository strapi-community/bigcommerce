import { z } from 'zod';

const baseSchema = z.object({
  clientId: z
    .string({ message: 'form.errors.required' })
    .min(1, { message: 'Client ID is required' }),
  clientSecret: z
    .string({ message: 'form.errors.required' })
    .min(1, { message: 'Client Secret is required' }),
  accessToken: z
    .string({ message: 'form.errors.required' })
    .min(1, { message: 'Access Token is required' }),
  storeHash: z
    .string({ message: 'form.errors.required' })
    .min(1, { message: 'Store Hash is required' }),
  addressStore: z
    .string({ message: 'form.errors.required' })
    .url({ message: 'Must be a valid URL' }),
});

export const fetchSettingsSchema = baseSchema.merge(
  z.object({
    channelId: z
      .number()
      .int()
      .positive()
      .array()
      .min(1)
      .transform((val) => val.join(',')),
    allowedCorsOrigins: z
      .string()
      .array()
      .optional()
      .default([])
      .transform((val) => val.join(',')),
  })
);

export type FetchSettingsFormSchema = z.infer<typeof fetchSettingsSchema>;

export const reqSettingsSchema = baseSchema.merge(
  z.object({
    channelId: z
      .string({ message: 'form.errors.required' })
      .min(1, { message: 'At least one Channel ID is required' })
      .transform((val) => val.split(',').map((id) => parseInt(id.trim(), 10))),
    allowedCorsOrigins: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',').map((origin) => origin.trim()) : [])),
  })
);

export type ReqSettingsFormSchema = z.infer<typeof reqSettingsSchema>;
