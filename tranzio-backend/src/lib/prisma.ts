import { PrismaClient } from '@prisma/client';

// Optimized Prisma client with connection pooling and performance settings
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling configuration
  __internal: {
    engine: {
      connectTimeout: 10000, // 10 seconds
      queryTimeout: 30000,   // 30 seconds
    },
  },
});

// Connection pooling for better performance
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
export default prisma;


