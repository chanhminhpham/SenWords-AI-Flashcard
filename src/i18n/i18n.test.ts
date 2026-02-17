import en from './en.json';
import vi from './vi.json';

function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe('i18n translation files', () => {
  const viKeys = getAllKeys(vi);
  const enKeys = getAllKeys(en);

  it('vi.json and en.json have identical keys (full parity)', () => {
    expect(viKeys).toEqual(enKeys);
  });

  it('no translation value is empty string', () => {
    const checkEmpty = (obj: Record<string, unknown>, file: string, prefix = '') => {
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (typeof value === 'string') {
          expect({ file, key: fullKey, value }).not.toEqual(expect.objectContaining({ value: '' }));
        } else if (typeof value === 'object' && value !== null) {
          checkEmpty(value as Record<string, unknown>, file, fullKey);
        }
      }
    };
    checkEmpty(vi, 'vi.json');
    checkEmpty(en, 'en.json');
  });

  it('interpolation placeholders match between vi and en', () => {
    const getPlaceholders = (str: string): string[] => {
      const matches = str.match(/\{\{(\w+)\}\}/g) ?? [];
      return matches.sort();
    };

    const viFlat = getAllKeys(vi);
    for (const key of viFlat) {
      const viVal = key
        .split('.')
        .reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], vi);
      const enVal = key
        .split('.')
        .reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], en);
      if (typeof viVal === 'string' && typeof enVal === 'string') {
        const viPlaceholders = getPlaceholders(viVal);
        const enPlaceholders = getPlaceholders(enVal);
        if (viPlaceholders.length > 0 || enPlaceholders.length > 0) {
          expect({ key, placeholders: viPlaceholders }).toEqual({
            key,
            placeholders: enPlaceholders,
          });
        }
      }
    }
  });

  it('vi.json is the default locale (fallbackLng)', () => {
    // Sanity check: vi should have at least the welcome key
    expect(vi.welcome).toBeDefined();
    expect(vi.welcome.tagline).toBeTruthy();
  });

  it('has accessibility keys for screen readers', () => {
    expect(vi.accessibility).toBeDefined();
    expect(en.accessibility).toBeDefined();
    expect(vi.accessibility.tutorialCard).toBeTruthy();
    expect(vi.accessibility.swipeRight).toBeTruthy();
    expect(vi.accessibility.undoAction).toBeTruthy();
  });
});
