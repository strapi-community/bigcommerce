import { StrapiContext } from '../@types';
import { getRestClient } from './clients/rest.client';
import { getGQLClient } from './clients/gql.client';

const bigCommerceService = ({ strapi }: StrapiContext) => {
  const restClient = getRestClient({ strapi });
  const gqlClient = getGQLClient({ strapi });
  return {
    // we use GQL client for search products by name because the REST API does not support searching by name fragment only by full name
    // and we want only name and entityId
    getGQLClient() {
      return gqlClient;
    },
    // we use REST client when we want to fetch products by ids, to omit create custom query for GQL - missing some products data
    getRestClient() {
      return restClient;
    },
  };
};

export default bigCommerceService;
