import bigCommerceService from '../big-commerce.service';
import type { StrapiContext } from '../../@types';
import { getRestClient } from '../clients/rest.client';
import { getGQLClient } from '../clients/gql.client';

// Mock the client modules
jest.mock('../clients/rest.client', () => ({
  getRestClient: jest.fn(),
}));
jest.mock('../clients/gql.client', () => ({
  getGQLClient: jest.fn(),
}));

const getMockStrapi = () => ({}) as unknown as StrapiContext['strapi'];

describe('bigCommerceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an object with getRestClient and getGQLClient methods', () => {
    // Arrange
    const strapi = getMockStrapi();
    const mockRestClient = { rest: true };
    const mockGQLClient = { gql: true };
    (getRestClient as jest.Mock).mockReturnValue(mockRestClient);
    (getGQLClient as jest.Mock).mockReturnValue(mockGQLClient);

    // Act
    const service = bigCommerceService({ strapi });

    // Assert
    expect(typeof service.getRestClient).toBe('function');
    expect(typeof service.getGQLClient).toBe('function');
  });

  it('getRestClient returns the rest client instance', () => {
    // Arrange
    const strapi = getMockStrapi();
    const mockRestClient = { rest: true };
    (getRestClient as jest.Mock).mockReturnValue(mockRestClient);

    // Act
    const service = bigCommerceService({ strapi });
    const client = service.getRestClient();

    // Assert
    expect(getRestClient).toHaveBeenCalledWith({ strapi });
    expect(client).toBe(mockRestClient);
  });

  it('getGQLClient returns the gql client instance', () => {
    // Arrange
    const strapi = getMockStrapi();
    const mockGQLClient = { gql: true };
    (getGQLClient as jest.Mock).mockReturnValue(mockGQLClient);

    // Act
    const service = bigCommerceService({ strapi });
    const client = service.getGQLClient();

    // Assert
    expect(getGQLClient).toHaveBeenCalledWith({ strapi });
    expect(client).toBe(mockGQLClient);
  });
});
