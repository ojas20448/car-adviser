/**
 * Prisma client singleton.
 *
 * In development Next.js hot-reloads modules, which would create
 * multiple PrismaClient instances. The global cache prevents this.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
