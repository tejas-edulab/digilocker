import morgan, { StreamOptions } from 'morgan';
import logger from '../utils/winston';

// Changing from default console log to stream
const stream: StreamOptions = {
  write: (message) => logger.http(message), // Using Winston Logger http severity
};

const morganMiddleware = morgan(':method :url :status :res[content-length] - :response-time ms', { stream });
export default morganMiddleware;
