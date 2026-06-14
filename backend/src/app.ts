import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './common/filters/error-filter';
import { logger } from './common/utils/logger';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import propertyRoutes from './modules/properties/properties.routes';
import tenantRoutes from './modules/tenants/tenants.routes';
import leaseRoutes from './modules/leases/leases.routes';
import paymentRoutes from './modules/payments/payments.routes';
import checkRoutes from './modules/checks/checks.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import activityLogRoutes from './modules/activity-log/activity-log.routes';
import searchRoutes from './modules/search/search.routes';

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Swagger
const swaggerSpec = {
  openapi: '3.0.0',
  info: { title: 'Rental Management API', version: '1.0.0', description: 'API for managing rental properties, leases, payments, and checks' },
  servers: [{ url: `/api/v1` }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
};
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/leases', leaseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/checks', checkRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/activity-logs', activityLogRoutes);
app.use('/api/v1/search', searchRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

export default app;
