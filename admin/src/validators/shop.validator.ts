import { z } from 'zod';

export type ShopProductSchema = z.infer<typeof shopProductSchema>;
export const shopProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  productId: z.union([z.string(), z.number()]),
  name: z.string(),
});
