import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LiveWell API',
      version: '1.0.0',
      description: 'API documentation for LiveWell backend',
    },
    servers: [{ url: 'http://localhost:4000/api' }],
    paths: {
      // Fallback doc so UI shows something even if no JSDoc picked up
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['System'],
          responses: { 200: { description: 'ok' } },
        },
      },
    },
  },
  // IMPORTANT: this glob must match your actual route files
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiMiddleware = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec, {
  explorer: true,
});
