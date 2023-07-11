import dotenv from 'dotenv';
import { Router } from 'express';
import digilocker from './digilocker/auth';

const router = Router();
dotenv.config();

const environment = process.env.NODE_ENV || 'development';
interface IRoutes {
  path: string,
  route: Router
}

// Production Routes
const productionRoutes: IRoutes[] = [
  {
    path: '/digilocker/auth',
    route: digilocker,
  },
];

// Development Routes
const devRoutes: IRoutes[] = [];

// Setting the production route
productionRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// Setting the development route
if (environment === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
