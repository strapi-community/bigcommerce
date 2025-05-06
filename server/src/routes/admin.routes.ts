import { StrapiRoute } from './types';

const routes: StrapiRoute<'admin'>[] = [
  {
    method: 'GET',
    path: '/settings',
    handler: 'admin.getConfig',
  },
  {
    method: 'PUT',
    path: '/settings',
    handler: 'admin.updateConfig',
  },
];

export default routes;
