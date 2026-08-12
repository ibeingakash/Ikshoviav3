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
  async uploadDocument(
    filename: string,
    buffer: Buffer,
    mimeType = 'application/pdf',
    bucket: 'ocr-documents' | 'resources' | 'user-uploads' = 'ocr-documents'
  ): Promise<string> {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('[Storage] Supabase is not configured. Storage operations require Supabase credentials.');
    }

    const sanitizeFilename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const key = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizeFilename}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(key, buffer, { contentType: mimeType, upsert: true });

    if (error) {
      console.error('[Storage] Supabase Storage upload error:', error.message);
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    return key;
  }

  async getDocument(key: string, bucket: 'ocr-documents' | 'resources' | 'user-uploads' = 'ocr-documents'): Promise<StorageDocument | null> {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('[Storage] Supabase is not configured. Storage operations require Supabase credentials.');
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
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('[Storage] Supabase is not configured. Storage operations require Supabase credentials.');
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
    return 0;
  }
}

export const documentStorage = new DocumentStorageService();


