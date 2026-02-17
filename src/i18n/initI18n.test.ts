/* eslint-disable import/first, import/no-named-as-default-member */
// Runtime tests for initI18n() — unmocks global i18n mock to test real module

jest.unmock('@/i18n');

// Define mocks inside factory to avoid jest hoisting TDZ issues
jest.mock('i18next', () => {
  const instance: Record<string, unknown> = {};
  instance.use = jest.fn().mockReturnValue(instance);
  instance.init = jest.fn().mockResolvedValue(undefined);
  return { __esModule: true, default: instance };
});

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'vi' }]),
}));

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

import i18next from 'i18next';
import { getLocales } from 'expo-localization';
import * as Sentry from '@sentry/react-native';

import { initI18n } from '@/i18n';

// Cast to jest.Mock for assertions (safe — they're all jest.fn() from factories above)
const mockUse = i18next.use as jest.Mock;
const mockInit = i18next.init as jest.Mock;
const mockGetLocales = getLocales as jest.Mock;
const mockCaptureException = Sentry.captureException as jest.Mock;

describe('initI18n()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUse.mockReturnValue(i18next);
    mockInit.mockResolvedValue(undefined);
    mockGetLocales.mockReturnValue([{ languageCode: 'vi' }]);
  });

  it('returns i18next instance', () => {
    const result = initI18n();
    expect(result).toBe(i18next);
  });

  it('calls i18next.use with initReactI18next', () => {
    initI18n();
    expect(mockUse).toHaveBeenCalledTimes(1);
  });

  it('configures vi as fallbackLng', () => {
    initI18n();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ fallbackLng: 'vi' }));
  });

  it('uses device language from expo-localization', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'en' }]);
    initI18n();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ lng: 'en' }));
  });

  it('falls back to vi when getLocales() throws', () => {
    mockGetLocales.mockImplementation(() => {
      throw new Error('localization unavailable');
    });
    initI18n();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ lng: 'vi' }));
  });

  it('falls back to vi when getLocales() returns empty array', () => {
    mockGetLocales.mockReturnValue([]);
    initI18n();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ lng: 'vi' }));
  });

  it('captures exception via Sentry when init() throws synchronously', () => {
    mockUse.mockImplementation(() => {
      throw new Error('sync init error');
    });
    initI18n();
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { module: 'i18n' } })
    );
  });

  it('captures exception via Sentry when init() rejects async', async () => {
    const asyncError = new Error('async init error');
    mockInit.mockRejectedValue(asyncError);
    initI18n();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockCaptureException).toHaveBeenCalledWith(
      asyncError,
      expect.objectContaining({ tags: { module: 'i18n' } })
    );
  });
});
