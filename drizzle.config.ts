import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/local-schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
});
