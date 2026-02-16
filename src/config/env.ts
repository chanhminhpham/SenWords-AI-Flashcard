export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
} as const;

const REQUIRED_VARS: (keyof typeof ENV)[] = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => ENV[key] === '');
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map((k) => `EXPO_PUBLIC_${k}`).join(', ')}. ` +
        'Check your .env file against .env.example.'
    );
  }
}
