import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/lib/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __dudPrisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (process.env.NODE_ENV === "production" && !databaseUrl) {
  throw new Error("DATABASE_URL muss in Produktion gesetzt sein.");
}

const adapter = new PrismaLibSql({
  url: databaseUrl || "file:./dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN?.trim() || undefined
});

export const prisma = globalThis.__dudPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.__dudPrisma = prisma;
}
