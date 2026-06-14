import winston from 'winston';
import { config } from '../../config';

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'rental-management-api' },
  transports: [
    new winston.transports.Console({
      format: config.nodeEnv === 'development'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : winston.format.json(),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880 }),
    new winston.transports.File({ filename: 'logs/combined.log', maxsize: 5242880 }),
  ],
});
