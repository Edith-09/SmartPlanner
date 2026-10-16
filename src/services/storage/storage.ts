import { createMMKV } from 'react-native-mmkv';
import { z, type ZodType } from 'zod';

export interface StorageDriver {
  getString(key: string): string | undefined;
  set(key: string, value: string | boolean | number): void;
  remove(key: string): boolean;
}

export interface TypedStorage {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  getBoolean(key: string): boolean | undefined;
  setBoolean(key: string, value: boolean): void;
  getJson<T>(key: string, schema: ZodType<T>, fallback: T, schemaVersion?: number): T;
  setJson<T>(key: string, value: T, schemaVersion?: number): void;
  remove(key: string): boolean;
}

const APP_NAMESPACE = 'smart-transport-planner';
const storageEnvelopeSchema = z.object({
  schemaVersion: z.number().int().positive(),
  data: z.unknown(),
});

export const storageKeys = {
  hasOnboarded: 'hasOnboarded',
  recents: 'recents',
  favorites: 'favorites',
  localReports: 'localReports',
  reportTimestamps: 'reportTimestamps',
} as const;

export function createTypedStorage(
  driver: StorageDriver,
  namespace = APP_NAMESPACE,
): TypedStorage {
  const keyFor = (key: string): string => `${namespace}:${key}`;

  return {
    getString(key) {
      return driver.getString(keyFor(key));
    },
    setString(key, value) {
      driver.set(keyFor(key), value);
    },
    getBoolean(key) {
      const value = driver.getString(keyFor(key));
      if (value === undefined) {
        return undefined;
      }
      if (value === 'true') {
        return true;
      }
      if (value === 'false') {
        return false;
      }
      return undefined;
    },
    setBoolean(key, value) {
      driver.set(keyFor(key), String(value));
    },
    getJson<T>(key: string, schema: ZodType<T>, fallback: T, schemaVersion = 1): T {
      const serialized = driver.getString(keyFor(key));
      if (!serialized) {
        return fallback;
      }

      try {
        const envelopeResult = storageEnvelopeSchema.safeParse(JSON.parse(serialized));
        if (!envelopeResult.success || envelopeResult.data.schemaVersion !== schemaVersion) {
          return fallback;
        }
        const valueResult = schema.safeParse(envelopeResult.data.data);
        return valueResult.success ? valueResult.data : fallback;
      } catch {
        return fallback;
      }
    },
    setJson<T>(key: string, value: T, schemaVersion = 1) {
      driver.set(
        keyFor(key),
        JSON.stringify({ schemaVersion, data: value }),
      );
    },
    remove(key) {
      return driver.remove(keyFor(key));
    },
  };
}

const mmkv = createMMKV({ id: APP_NAMESPACE });

export const storage = createTypedStorage({
  getString: (key) => mmkv.getString(key),
  set: (key, value) => mmkv.set(key, value),
  remove: (key) => mmkv.remove(key),
});