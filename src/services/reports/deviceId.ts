import { storage, storageKeys } from '@/services/storage/storage';

const DEVICE_ID_LENGTH = 24;
const DEVICE_ID_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

let cachedDeviceId: string | undefined;

export function getDeviceId(): string {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  const storedDeviceId = storage.getString(storageKeys.deviceId);
  if (storedDeviceId) {
    cachedDeviceId = storedDeviceId;
    return storedDeviceId;
  }

  let deviceId = '';
  for (let index = 0; index < DEVICE_ID_LENGTH; index += 1) {
    const characterIndex = Math.floor(Math.random() * DEVICE_ID_CHARACTERS.length);
    deviceId += DEVICE_ID_CHARACTERS[characterIndex];
  }

  storage.setString(storageKeys.deviceId, deviceId);
  cachedDeviceId = deviceId;
  return deviceId;
}