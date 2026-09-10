/**
 * Storage Provider Abstraction
 * Allows pluggable storage backends (Google Drive, Cloudflare R2, Supabase, Local).
 */

export interface StorageUploadParams {
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  folderCategory?: 'BOOKS' | 'RESOURCES' | 'OFFICIAL_DOCUMENTS' | 'NOTES';
  metadata?: Record<string, any>;
}

export interface StorageUploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderId?: string;
  folderCategory?: string;
  webUrl?: string;
}

export interface StorageMetadataResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface StorageProvider {
  readonly name: string;

  /**
   * Check if the storage provider is actively connected/configured.
   */
  isConfigured(): Promise<boolean>;

  /**
   * Uploads a file (using resumable or streamed upload for large files).
   */
  uploadFile(params: StorageUploadParams): Promise<StorageUploadResult>;

  /**
   * Returns a readable stream of the file content for secure backend streaming.
   */
  downloadFileStream(fileId: string): Promise<NodeJS.ReadableStream>;

  /**
   * Fetches metadata for a stored file.
   */
  getFileMetadata(fileId: string): Promise<StorageMetadataResult>;

  /**
   * Deletes a file by ID.
   */
  deleteFile(fileId: string): Promise<boolean>;

  /**
   * Ensures folder hierarchy exists in the storage provider.
   */
  ensureFolders?(): Promise<Record<string, string>>;
}
