import path from 'path';

export interface StorageDocument {
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
  uploadedAt: string;
}

// In-memory / abstracted object storage service (e.g. R2 / S3 abstraction)
class DocumentStorageService {
  private store = new Map<string, StorageDocument>();

  async uploadDocument(filename: string, buffer: Buffer, mimeType = 'application/pdf'): Promise<string> {
    const key = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${path.basename(filename)}`;
    const doc: StorageDocument = {
      key,
      filename,
      mimeType,
      sizeBytes: buffer.length,
      buffer,
      uploadedAt: new Date().toISOString(),
    };
    this.store.set(key, doc);
    return key;
  }

  async getDocument(key: string): Promise<StorageDocument | null> {
    return this.store.get(key) || null;
  }

  async deleteDocument(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async getSignedDocumentUrl(key: string): Promise<string> {
    const doc = this.store.get(key);
    if (!doc) throw new Error('Document not found in storage abstraction');
    // Return abstract internal URL path
    return `/api/admin/ocr/storage/${key}`;
  }

  // Cleanup abandoned temp documents older than 2 hours
  async cleanupAbandonedTempDocs(maxAgeMs = 2 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, doc] of this.store.entries()) {
      const age = now - new Date(doc.uploadedAt).getTime();
      if (age > maxAgeMs) {
        this.store.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export const documentStorage = new DocumentStorageService();
