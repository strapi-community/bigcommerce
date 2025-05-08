import products from './products.service';
import cache from './cache.service';
import bigCommerce from './bigcommerce.service';
import admin from './admin.service';

const services = {
  products,
  cache,
  'bigcommerce': bigCommerce,
  admin,
};
export type Services = {
  [key in keyof typeof services]: ReturnType<(typeof services)[key]>;
};
export default services;
