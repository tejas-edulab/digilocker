import { rateLimit } from 'express-rate-limit';
import { IApiErrors } from '../types/error';

// Rate Limitter
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 500, // Limit each IP to 500 requests per `window` (here, per 5 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: IApiErrors.TOO_MANY_REQUESTS, // Custom Error Message
});

export default limiter;
