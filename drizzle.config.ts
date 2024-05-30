import { type Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1",
  dbCredentials: {
    dbName: "bite-speed",
    wranglerConfigPath: "./wrangler.toml",
  },
  strict: true,
} satisfies Config;
