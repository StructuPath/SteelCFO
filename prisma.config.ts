import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Read lazily so commands that don't touch the DB (e.g. `prisma
    // generate` in CI/Docker) work without a connection string.
    url: process.env.DATABASE_URL ?? "",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
})
