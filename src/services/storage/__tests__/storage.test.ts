import { z } from 'zod';

import { createTypedStorage, type StorageDriver } from '../storage';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

function createMemoryStorage() {
  const values = new Map<string, string>();
  const driver: StorageDriver = {
    getString: (key) => values.get(key),
    set: (key, value) => values.set(key, String(value)),
    remove: (key) => values.delete(key),
  };
  return { driver, values };
}

describe('typed MMKV storage wrapper', () => {
  it('namespaces keys and reads/writes schema-versioned values', () => {
    const { driver, values } = createMemoryStorage();
    const store = createTypedStorage(driver, 'test-app');
    const schema = z.object({ count: z.number() });

    store.setJson('sample', { count: 2 }, 3);

    expect([...values.keys()]).toEqual(['test-app:sample']);
    expect(store.getJson('sample', schema, { count: 0 }, 3)).toEqual({ count: 2 });
  });

  it('falls back for missing, malformed, wrong-version, and invalid data', () => {
    const { driver, values } = createMemoryStorage();
    const store = createTypedStorage(driver);
    const schema = z.object({ count: z.number() });
    const fallback = { count: 0 };

    expect(store.getJson('missing', schema, fallback)).toBe(fallback);
    values.set('smart-transport-planner:bad-json', '{');
    values.set('smart-transport-planner:old-version', JSON.stringify({ schemaVersion: 1, data: { count: 1 } }));
    values.set('smart-transport-planner:bad-shape', JSON.stringify({ schemaVersion: 2, data: { count: 'wrong' } }));

    expect(store.getJson('bad-json', schema, fallback)).toBe(fallback);
    expect(store.getJson('old-version', schema, fallback, 2)).toBe(fallback);
    expect(store.getJson('bad-shape', schema, fallback, 2)).toBe(fallback);
  });

  it('round-trips primitive values and removes namespaced keys', () => {
    const { driver } = createMemoryStorage();
    const store = createTypedStorage(driver, 'test-app');

    store.setString('label', 'Home');
    store.setBoolean('onboarded', true);
    expect(store.getString('label')).toBe('Home');
    expect(store.getBoolean('onboarded')).toBe(true);
    expect(store.remove('label')).toBe(true);
    expect(store.getString('label')).toBeUndefined();
  });
});