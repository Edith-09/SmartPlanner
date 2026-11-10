import { useSyncExternalStore } from 'react';

import { storage, storageKeys } from '@/services/storage/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

const listeners = new Set<() => void>();
let preference: ThemePreference = 'system';
let loaded = false;

function isThemePreference(value: string | undefined): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function loadPreference(): void {
  if (loaded) {
    return;
  }

  try {
    const storedPreference = storage.getString(storageKeys.themePreference);
    preference = isThemePreference(storedPreference) ? storedPreference : 'system';
  } catch {
    preference = 'system';
  }
  loaded = true;
}

export function getThemePreference(): ThemePreference {
  loadPreference();
  return preference;
}

export function setThemePreference(nextPreference: ThemePreference): void {
  loadPreference();
  preference = nextPreference;
  try {
    storage.setString(storageKeys.themePreference, nextPreference);
  } catch {}
  listeners.forEach((listener) => listener());
}

export function subscribeThemePreference(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    subscribeThemePreference,
    getThemePreference,
    getThemePreference,
  );
}