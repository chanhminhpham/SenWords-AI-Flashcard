/* eslint-disable @typescript-eslint/no-require-imports */
import { ENV } from './env';

describe('ENV config', () => {
  it('should export ENV object with all required keys', () => {
    expect(ENV).toHaveProperty('SUPABASE_URL');
    expect(ENV).toHaveProperty('SUPABASE_ANON_KEY');
    expect(ENV).toHaveProperty('SENTRY_DSN');
  });

  it('should read from EXPO_PUBLIC_ prefixed env vars', () => {
    // Verify the env var mapping uses correct prefix
    // In test env, process.env won't have these set, so they default to ""
    expect(ENV.SUPABASE_URL).toBe(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '');
    expect(ENV.SUPABASE_ANON_KEY).toBe(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '');
    expect(ENV.SENTRY_DSN).toBe(process.env.EXPO_PUBLIC_SENTRY_DSN ?? '');
  });
});

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw when SUPABASE_URL is missing', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const { validateEnv: validate } = require('./env');
    expect(() => validate()).toThrow('Missing required environment variables');
    expect(() => validate()).toThrow('EXPO_PUBLIC_SUPABASE_URL');
  });

  it('should throw when SUPABASE_ANON_KEY is missing', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const { validateEnv: validate } = require('./env');
    expect(() => validate()).toThrow('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('should not throw when all required vars are present', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { validateEnv: validate } = require('./env');
    expect(() => validate()).not.toThrow();
  });

  it('should not require SENTRY_DSN (optional)', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;

    const { validateEnv: validate } = require('./env');
    expect(() => validate()).not.toThrow();
  });
});
