import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL database successfully via Prisma');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
