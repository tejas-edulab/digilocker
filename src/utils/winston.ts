import winston from 'winston';

// Log Levels
const levels = {
  error: 0,
  warn: 1,
  info: 3,
  http: 4,
  debug: 5,
};

// Specify according to environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Colors for logging
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Adding colors
winston.addColors(colors);

// Creating Custom Format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Transports
const transports = [
  new winston.transports.Console(), // Logging to Console
  // Logging error logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // Logging all logs
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Logger Initialize
const logger: winston.Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Exporting Logs
export default logger;
