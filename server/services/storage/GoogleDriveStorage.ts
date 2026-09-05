import { StorageProvider, StorageUploadParams, StorageUploadResult, StorageMetadataResult } from './StorageProvider.js';
import { googleDriveService } from '../googleDriveService.js';

export class GoogleDriveStorage implements StorageProvider {
  public readonly name = 'GoogleDrive';

  async isConfigured(): Promise<boolean> {
    const status = await googleDriveService.getStatus();
    return status.connected;
  }

  async uploadFile(params: StorageUploadParams): Promise<StorageUploadResult> {
    // 1. Ensure dedicated folders exist
    let folders: any;
    const status = await googleDriveService.getStatus();
    if (!status.connected) {
      throw new Error('Google Drive integration is not connected. Please connect Google Drive in Admin Studio.');
    }

    folders = status.folders;
    if (!folders || !folders.resourcesId) {
      folders = await googleDriveService.ensureFolderStructure();
    }

    // 2. Determine target folder ID based on category
    let targetFolderId = folders.resourcesId;
    if (params.folderCategory === 'OFFICIAL_DOCUMENTS' && folders.officialDocsId) {
      targetFolderId = folders.officialDocsId;
    } else if (params.folderCategory === 'NOTES' && folders.notesId) {
      targetFolderId = folders.notesId;
    }

    // 3. Execute resumable upload
    const result = await googleDriveService.uploadPdfResumable(
      params.fileName,
      params.buffer,
      targetFolderId
    );

    return {
      fileId: result.fileId,
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: params.mimeType || 'application/pdf',
      folderId: targetFolderId,
      folderCategory: params.folderCategory || 'RESOURCES',
      webUrl: result.webViewLink,
    };
  }

  async downloadFileStream(fileId: string): Promise<NodeJS.ReadableStream> {
    return googleDriveService.downloadFileStream(fileId);
  }

  async getFileMetadata(fileId: string): Promise<StorageMetadataResult> {
    const meta = await googleDriveService.getFileMetadata(fileId);
    return {
      fileId: meta.id,
      fileName: meta.name,
      fileSize: Number(meta.size || 0),
      mimeType: meta.mimeType || 'application/pdf',
      createdTime: meta.createdTime,
      modifiedTime: meta.modifiedTime,
    };
  }

  async deleteFile(fileId: string): Promise<boolean> {
    return googleDriveService.deleteFile(fileId);
  }

  async ensureFolders(): Promise<Record<string, string>> {
    const folders = await googleDriveService.ensureFolderStructure();
    return folders as any;
  }
}

export const googleDriveStorage = new GoogleDriveStorage();
