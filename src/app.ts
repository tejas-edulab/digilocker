import * as dotenv from 'dotenv';
import 'reflect-metadata';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import logger from './utils/winston';

import limiter from './middlewares/rate-limiter';
import errorHandlingMiddleWare from './middlewares/error-handler';
import routesV1 from './routes/v1';
import { IApiErrors } from './types/error';
import morganMiddleware from './middlewares/morgan';

// Initialization
dotenv.config();
const app: Express = express();
const port: number = Number(process.env.PORT) || 3002;

// Middlewares and Routes
app.use(morganMiddleware); // Morgan Logger Middleware
app.use(cors()); // Enable Cors for browsers
app.use(limiter); // Rate Limitter Middleware
app.use(express.urlencoded({ extended: true })); // URL parser
app.use(express.json()); // Body parser
app.get('/', (req: Request, res: Response) => res.send('Express + TypeScript Server')); // Health check
app.use('/v1', routesV1); // V1 Routes
app.use(errorHandlingMiddleWare); // Error handling middleware
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ status: 404, message: IApiErrors.NOT_FOUND });
}); // Not Found Middleware

app.listen(port, () => {
  logger.info(`Server is running at http://localhost:${port}`);
});

// Exporting app
export default app;
