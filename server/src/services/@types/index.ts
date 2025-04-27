export type ProductService = {
  getProductsById: (products: number[]) => Promise<Map<number, any>>;
  searchProducts: (query: string, vendor?: string) => Promise<any>;
};

// BigCommerce REST API Product
export interface BigCommerceRestProduct {
  id: number;
  name: string;
  sku: string;
  description?: string;
  price?: number;
  // Add more fields as needed from the API
}

export interface BigCommerceRestProductResponse {
  data: BigCommerceRestProduct[];
  meta?: any;
}

// BigCommerce GQL API Product
export interface BigCommerceGqlProductPrice {
  price: { value: number; currencyCode: string };
  retailPrice?: { value: number; currencyCode: string };
  salePrice?: { value: number; currencyCode: string };
  basePrice?: { value: number; currencyCode: string };
}

export interface BigCommerceGqlProductImage {
  url: string;
  urlOriginal: string;
  altText?: string;
  isDefault?: boolean;
}

export interface BigCommerceGqlProductVideo {
  title: string;
  url: string;
}

export interface BigCommerceGqlProductCustomField {
  entityId: number;
  name: string;
  value: string;
}

export interface BigCommerceGqlProductMetafield {
  id: string;
  entityId: number;
  key: string;
  value: string;
}

export interface BigCommerceGqlProductOptionValue {
  entityId: number;
  label: string;
  isDefault: boolean;
  hexColors?: string[];
  imageUrl?: string;
}

export interface BigCommerceGqlProductOption {
  entityId: number;
  displayName: string;
  isRequired: boolean;
  isVariantOption: boolean;
  displayStyle?: string;
  values?: { edges: { node: BigCommerceGqlProductOptionValue }[] };
}

export interface BigCommerceGqlGiftWrappingOption {
  entityId: number;
  name: string;
  allowComments: boolean;
  previewImageUrl?: string;
}

export interface BigCommerceGqlProductReview {
  entityId: number;
  author: { name: string };
  title: string;
  text: string;
  rating: number;
  createdAt: { utc: string };
}

export interface BigCommerceGqlProduct {
  productId: number;
  id: number;
  entityId: number;
  name: string;
  sku?: string;
  description?: string;
  path?: string;
  addToCartUrl?: string;
  upc?: string;
  mpn?: string;
  gtin?: string;
  prices?: BigCommerceGqlProductPrice;
  defaultImage?: BigCommerceGqlProductImage;
  images?: { edges: { node: BigCommerceGqlProductImage }[] };
  videos?: { edges: { node: BigCommerceGqlProductVideo }[] };
  customFields?: { edges: { node: BigCommerceGqlProductCustomField }[] };
  metafields?: { edges: { node: BigCommerceGqlProductMetafield }[] };
  productOptions?: { edges: { node: BigCommerceGqlProductOption }[] };
  giftWrappingOptions?: { edges: { node: BigCommerceGqlGiftWrappingOption }[] };
  reviews?: { edges: { node: BigCommerceGqlProductReview }[] };
}

export interface BigCommerceGqlProductsResponse {
  data: {
    site: {
      products: {
        edges: { node: BigCommerceGqlProduct }[];
      };
    };
  };
}

export interface BigCommerceGqlSearchProductsResponse {
  data: {
    site: {
      search: {
        searchProducts: {
          products: {
            edges: { node: BigCommerceGqlProduct }[];
          };
        };
      };
    };
  };
}
