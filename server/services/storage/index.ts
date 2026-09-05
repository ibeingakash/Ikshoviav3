import { StorageProvider } from './StorageProvider.js';
import { googleDriveStorage } from './GoogleDriveStorage.js';

export * from './StorageProvider.js';
export * from './GoogleDriveStorage.js';

/**
 * Pluggable Storage Provider Factory.
 * Defaults to GoogleDriveStorage; extensible for Cloudflare R2 / S3 without modifying downstream logic.
 */
export function getStorageProvider(): StorageProvider {
  return googleDriveStorage;
}
