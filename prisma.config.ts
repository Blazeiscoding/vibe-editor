import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load .env file explicitly
config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
