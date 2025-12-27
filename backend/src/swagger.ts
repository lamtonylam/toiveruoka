import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Unicafe Food Finder API',
      version: '1.0.0',
      description: 'Find where and when your favorite food is available at Unicafe restaurants.',
    },
    servers: [
      {
        url: 'https://unari-backend.ynot.fi',
        description: 'Server URL',
      },
    ],
  },
  apis: ['./src/index.ts'],
};

 
export const swaggerSpec = swaggerJsdoc(options);
