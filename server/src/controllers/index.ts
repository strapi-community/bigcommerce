import contentManagerController from './content.manager.controller';

const controllers = {
  contentManager: contentManagerController,
};
export type Controllers = {
  [key in keyof typeof controllers]: ReturnType<(typeof controllers)[key]>;
};
export default controllers;
