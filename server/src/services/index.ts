import products from './products.service';
import cache from './cache.service';
import bigCommerce from './big-commerce.service';

const services = {
  products,
  cache,
  'big-commerce': bigCommerce,
};
export type Services = {
  [key in keyof typeof services]: ReturnType<(typeof services)[key]>;
};
export default services;
