import { pool } from '../db/pool.js';
import { Readable } from 'stream';

export interface GoogleOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiryDate: number; // Unix timestamp in ms
  scopes: string[];
  tokenType: string;
}

export interface DriveFolderStructure {
  rootId: string;
  resourcesId: string;
  officialDocsId: string;
  notesId: string;
}

export interface DriveStatusResponse {
  connected: boolean;
  accountEmail?: string;
  folders?: DriveFolderStructure;
  lastSync?: string;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService;

  private constructor() {}

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  private getClientId(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  }

  private getClientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  }

  private getRedirectUri(): string {
    if (process.env.GOOGLE_REDIRECT_URI) {
      return process.env.GOOGLE_REDIRECT_URI;
    }
    if (process.env.GOOGLE_DRIVE_REDIRECT_URI) {
      return process.env.GOOGLE_DRIVE_REDIRECT_URI;
    }
    const appUrl = process.env.APP_URL || (process.env.NODE_ENV === 'production' ? 'https://ikshoviav3.onrender.com' : 'http://localhost:3000');
    return `${appUrl.replace(/\/+$/, '')}/api/auth/google/callback`;
  }

  /**
   * Generates Google OAuth 2.0 consent URL requesting minimum necessary Drive scope: drive.file
   */
  public generateAuthUrl(state: string): string {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured in backend environment.');
    }

    const redirectUri = this.getRedirectUri();
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent', // Force consent screen to guarantee receiving a refresh_token
      state: state || 'admin_connect',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for OAuth tokens and stores them in Postgres
   */
  public async handleOAuthCallback(code: string): Promise<{ email: string; folders: DriveFolderStructure }> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri();

    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing from backend configuration.');
    }

    // 1. Exchange authorization code
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[GoogleDriveService] Token exchange error:', errBody);
      throw new Error(`Failed to exchange Google OAuth code: ${tokenRes.statusText}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresInSec = tokenData.expires_in || 3600;
    const expiryDate = Date.now() + (expiresInSec - 120) * 1000;
    const scopes = (tokenData.scope || '').split(' ');
    const tokenType = tokenData.token_type || 'Bearer';

    // 2. Fetch connected Google account email
    let email = 'ikshovia.admin@gmail.com';
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userinfoRes.ok) {
        const userInfo = await userinfoRes.json();
        if (userInfo.email) email = userInfo.email;
      }
    } catch (uErr) {
      console.warn('[GoogleDriveService] Could not fetch user profile email:', uErr);
    }

    // 3. Upsert integration into Postgres
    // If refreshToken is omitted (re-auth without consent prompt), keep existing refreshToken
    let finalRefreshToken = refreshToken;
    if (!finalRefreshToken) {
      const existing = await pool.query(
        "SELECT refresh_token FROM public.oauth_integrations WHERE provider = 'google_drive'"
      );
      if (existing.rows.length > 0 && existing.rows[0].refresh_token) {
        finalRefreshToken = existing.rows[0].refresh_token;
      }
    }

    await pool.query(
      `INSERT INTO public.oauth_integrations (
        id, provider, account_email, access_token, refresh_token, expiry_date, token_type, scopes, updated_at
      ) VALUES ($1, 'google_drive', $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (provider) DO UPDATE SET
        account_email = EXCLUDED.account_email,
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, public.oauth_integrations.refresh_token),
        expiry_date = EXCLUDED.expiry_date,
        token_type = EXCLUDED.token_type,
        scopes = EXCLUDED.scopes,
        updated_at = NOW()`,
      ['integ_google_drive', email, accessToken, finalRefreshToken, expiryDate, tokenType, scopes]
    );

    // 4. Ensure dedicated IKSHOVIA folders
    const folders = await this.ensureFolderStructure(accessToken);

    return { email, folders };
  }

  /**
   * Retrieves a valid access token, auto-refreshing via refresh_token if expired.
   */
  public async getValidAccessToken(): Promise<string> {
    const res = await pool.query(
      "SELECT access_token, refresh_token, expiry_date FROM public.oauth_integrations WHERE provider = 'google_drive'"
    );

    if (res.rows.length === 0) {
      throw new Error('Google Drive integration is not connected. Please connect via Admin Studio.');
    }

    const { access_token, refresh_token, expiry_date } = res.rows[0];
    const now = Date.now();

    // If token is still valid for > 3 minutes, return it
    if (access_token && Number(expiry_date) > now + 3 * 60 * 1000) {
      return access_token;
    }

    // Need refresh
    if (!refresh_token) {
      throw new Error('Google Drive refresh token is missing. Please reconnect Google Drive in Admin Studio.');
    }

    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable is missing.');
    }

    console.log('[GoogleDriveService] Refreshing expired access token...');
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshRes.ok) {
      const errText = await refreshRes.text();
      console.error('[GoogleDriveService] Refresh token failed:', errText);
      throw new Error('Failed to refresh Google Drive access token. Please re-authenticate.');
    }

    const refreshed = await refreshRes.json();
    const newAccessToken = refreshed.access_token;
    const expiresInSec = refreshed.expires_in || 3600;
    const newExpiry = Date.now() + (expiresInSec - 120) * 1000;

    await pool.query(
      `UPDATE public.oauth_integrations
       SET access_token = $1, expiry_date = $2, updated_at = NOW()
       WHERE provider = 'google_drive'`,
      [newAccessToken, newExpiry]
    );

    return newAccessToken;
  }

  /**
   * Checks current connection status without exposing sensitive credentials
   */
  public async getStatus(): Promise<DriveStatusResponse> {
    try {
      const res = await pool.query(
        "SELECT account_email, expiry_date, folders_json, updated_at FROM public.oauth_integrations WHERE provider = 'google_drive'"
      );

      if (res.rows.length === 0) {
        return { connected: false };
      }

      const row = res.rows[0];
      return {
        connected: true,
        accountEmail: row.account_email || 'Connected Account',
        folders: row.folders_json || undefined,
        lastSync: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
      };
    } catch {
      return { connected: false };
    }
  }

  /**
   * Disconnects Google Drive integration
   */
  public async disconnect(): Promise<void> {
    await pool.query("DELETE FROM public.oauth_integrations WHERE provider = 'google_drive'");
  }

  /**
   * Automatically verifies or creates the folder hierarchy:
   * IKSHOVIA/
   *   Resources/
   *   Official-Documents/
   *   IKSHOVIA-Notes/
   */
  public async ensureFolderStructure(tokenOverride?: string): Promise<DriveFolderStructure> {
    const accessToken = tokenOverride || (await this.getValidAccessToken());

    // 1. Root "IKSHOVIA" folder
    const rootId = await this.getOrCreateFolder('IKSHOVIA', undefined, accessToken);

    // 2. Sub-folders
    const resourcesId = await this.getOrCreateFolder('Resources', rootId, accessToken);
    const officialDocsId = await this.getOrCreateFolder('Official-Documents', rootId, accessToken);
    const notesId = await this.getOrCreateFolder('IKSHOVIA-Notes', rootId, accessToken);

    const folders: DriveFolderStructure = {
      rootId,
      resourcesId,
      officialDocsId,
      notesId,
    };

    // Save folder IDs to DB
    await pool.query(
      `UPDATE public.oauth_integrations
       SET root_folder_id = $1, folders_json = $2, updated_at = NOW()
       WHERE provider = 'google_drive'`,
      [rootId, JSON.stringify(folders)]
    );

    return folders;
  }

  private async getOrCreateFolder(folderName: string, parentId: string | undefined, accessToken: string): Promise<string> {
    // Search query
    let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create if not found
    const createBody: Record<string, any> = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
      createBody.parents = [parentId];
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createBody),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error(`[GoogleDriveService] Create folder '${folderName}' failed:`, errText);
      throw new Error(`Failed to create Google Drive folder '${folderName}'`);
    }

    const createdData = await createRes.json();
    return createdData.id;
  }

  /**
   * Resumable upload of PDF buffer to Google Drive
   */
  public async uploadPdfResumable(
    fileName: string,
    pdfBuffer: Buffer,
    folderId?: string
  ): Promise<{ fileId: string; fileName: string; fileSize: number; webViewLink?: string }> {
    const accessToken = await this.getValidAccessToken();

    // 1. Initiate Resumable Upload session
    const metadata: Record<string, any> = {
      name: fileName,
      mimeType: 'application/pdf',
    };
    if (folderId) {
      metadata.parents = [folderId];
    }

    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'application/pdf',
        'X-Upload-Content-Length': pdfBuffer.length.toString(),
      },
      body: JSON.stringify(metadata),
    });

    if (!initRes.ok) {
      const err = await initRes.text();
      console.error('[GoogleDriveService] Resumable upload init failed:', err);
      throw new Error(`Failed to initialize Google Drive resumable upload: ${initRes.statusText}`);
    }

    const locationUrl = initRes.headers.get('location');
    if (!locationUrl) {
      throw new Error('Google Drive upload did not provide a resumable session Location URL.');
    }

    // 2. PUT the binary buffer into the resumable Location
    const uploadRes = await fetch(locationUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': pdfBuffer.length.toString(),
        'Content-Type': 'application/pdf',
      },
      body: pdfBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('[GoogleDriveService] Resumable payload PUT failed:', err);
      throw new Error(`Failed to upload file content to Google Drive: ${uploadRes.statusText}`);
    }

    const result = await uploadRes.json();
    return {
      fileId: result.id,
      fileName: result.name || fileName,
      fileSize: pdfBuffer.length,
      webViewLink: result.webViewLink,
    };
  }

  /**
   * Returns a readable stream of the file content for secure server-side streaming
   */
  public async downloadFileStream(fileId: string): Promise<NodeJS.ReadableStream> {
    const accessToken = await this.getValidAccessToken();

    const fileUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
    const res = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok || !res.body) {
      throw new Error(`Failed to stream file from Google Drive: ${res.statusText}`);
    }

    // Convert Web ReadableStream to Node.js Readable stream
    return Readable.fromWeb(res.body as any);
  }

  /**
   * Downloads the complete file buffer from Google Drive
   */
  public async downloadFileBuffer(fileId: string): Promise<Buffer> {
    const accessToken = await this.getValidAccessToken();

    const fileUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
    const res = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch file from Google Drive: ${res.statusText}`);
    }

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  /**
   * Get file metadata
   */
  public async getFileMetadata(fileId: string): Promise<any> {
    const accessToken = await this.getValidAccessToken();
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,size,mimeType,createdTime,modifiedTime`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to get Google Drive file metadata: ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Delete file from Google Drive
   */
  public async deleteFile(fileId: string): Promise<boolean> {
    const accessToken = await this.getValidAccessToken();
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.ok || res.status === 404;
  }
}

export const googleDriveService = GoogleDriveService.getInstance();
