import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'AppleAura API',
    version: '1.0.0',
    description: 'API documentation for AppleAura - Marketplace for Apple products',
    contact: {
      name: 'AppleAura Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          name: {
            type: 'string',
            description: 'User full name',
          },
          role: {
            type: 'string',
            enum: ['buyer', 'seller'],
            description: 'User role',
          },
          createdAt: {
            type: 'integer',
            description: 'User creation timestamp',
          },
        },
        required: ['id', 'email', 'name', 'role'],
      },
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Product ID',
          },
          sellerId: {
            type: 'string',
            description: 'Seller ID',
          },
          categoryId: {
            type: 'string',
            description: 'Category ID',
          },
          title: {
            type: 'string',
            description: 'Product title',
          },
          slug: {
            type: 'string',
            description: 'Product URL slug',
          },
          description: {
            type: 'string',
            description: 'Product description',
          },
          images: {
            type: 'string',
            description: 'JSON string of product images',
          },
          status: {
            type: 'string',
            enum: ['draft', 'active', 'inactive'],
            description: 'Product status',
          },
        },
        required: ['id', 'sellerId', 'categoryId', 'title', 'slug'],
      },
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Order ID',
          },
          userId: {
            type: 'string',
            description: 'User ID who placed the order',
          },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            description: 'Order status',
          },
          total: {
            type: 'integer',
            description: 'Total order amount in cents',
          },
        },
        required: ['id', 'userId', 'status', 'total'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email',
          },
          password: {
            type: 'string',
            description: 'User password',
          },
        },
        required: ['email', 'password'],
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email',
          },
          passwordHash: {
            type: 'string',
            description: 'User password',
          },
          name: {
            type: 'string',
            description: 'User full name',
          },
          role: {
            type: 'string',
            enum: ['buyer', 'seller'],
            description: 'User role',
            default: 'buyer',
          },
        },
        required: ['email', 'passwordHash', 'name'],
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
            description: 'JWT token',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Error message',
          },
          error: {
            type: 'object',
            description: 'Error details',
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./server/routes.ts', './server/**/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options);