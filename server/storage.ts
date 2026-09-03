import path from 'path';
import { getSupabase } from './supabase.js';

export interface StorageDocument {
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
  uploadedAt: string;
  publicUrl?: string;
}

class DocumentStorageService {
  private tempMemoryStore = new Map<string, StorageDocument>();

  async uploadDocument(
    filename: string,
    buffer: Buffer,
    mimeType = 'application/pdf',
    bucket: 'ocr-documents' | 'resources' | 'user-uploads' = 'ocr-documents'
  ): Promise<string> {
    const sanitizeFilename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const key = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizeFilename}`;

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(key, buffer, { contentType: mimeType, upsert: true });

        if (!error) {
          return key;
        }
        console.warn('[Storage] Supabase Storage upload error, falling back to temp memory store:', error.message);
      } catch (err: any) {
        console.warn('[Storage] Supabase Storage upload exception, falling back to temp memory store:', err.message);
      }
    }

    // Local in-memory temporary store
    this.tempMemoryStore.set(key, {
      key,
      filename,
      mimeType,
      sizeBytes: buffer.length,
      buffer,
      uploadedAt: new Date().toISOString(),
    });

    return key;
  }

  async getDocument(key: string, bucket: 'ocr-documents' | 'resources' | 'user-uploads' = 'ocr-documents'): Promise<StorageDocument | null> {
    const memDoc = this.tempMemoryStore.get(key);
    if (memDoc) return memDoc;

    const supabase = getSupabase();
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase.storage.from(bucket).download(key);
      if (error || !data) {
        // Try fallback bucket if needed
        const { data: altData, error: altErr } = await supabase.storage.from('ocr-documents').download(key);
        if (altErr || !altData) return null;
        const arrayBuffer = await altData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
          key,
          filename: key,
          mimeType: key.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
          sizeBytes: buffer.length,
          buffer,
          uploadedAt: new Date().toISOString(),
        };
      }

      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return {
        key,
        filename: key,
        mimeType: key.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
        sizeBytes: buffer.length,
        buffer,
        uploadedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn('[Storage] Supabase Storage download exception:', err.message);
      return null;
    }
  }

  async deleteDocument(key: string, bucket: 'ocr-documents' | 'resources' | 'user-uploads' = 'ocr-documents'): Promise<boolean> {
    this.tempMemoryStore.delete(key);
    const supabase = getSupabase();
    if (!supabase) {
      return true;
    }

    const { error } = await supabase.storage.from(bucket).remove([key]);
    if (error) {
      console.warn('[Storage] Supabase delete warning:', error.message);
      return false;
    }
    return true;
  }

  async getSignedDocumentUrl(key: string, bucket: 'ocr-documents' | 'resources' | 'user-uploads' = 'ocr-documents'): Promise<string> {
    const supabase = getSupabase();
    if (!supabase) {
      return `/api/admin/ocr/storage/${key}`;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    if (data?.publicUrl) {
      return data.publicUrl;
    }

    return `/api/admin/ocr/storage/${key}`;
  }

  async cleanupAbandonedTempDocs(): Promise<number> {
    const size = this.tempMemoryStore.size;
    this.tempMemoryStore.clear();
    return size;
  }
}

export const documentStorage = new DocumentStorageService();


