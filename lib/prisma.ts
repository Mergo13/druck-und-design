import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/lib/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __dudPrisma: PrismaClient | undefined;
}

const adapter = new PrismaLibSql({
  url: "file:./dev.db"
});

export const prisma = globalThis.__dudPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.__dudPrisma = prisma;
}
