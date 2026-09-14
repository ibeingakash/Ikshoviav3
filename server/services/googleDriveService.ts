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
  booksId?: string;
  officialDocsId: string;
  notesId: string;
}

export interface DriveStatusResponse {
  connected: boolean;
  accountEmail?: string;
  folders?: DriveFolderStructure;
  lastSync?: string;
  hasDriveScope?: boolean;
  grantedScopes?: string[];
  rootFolderCreated?: boolean;
  error?: string;
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

  public isConfigured(): boolean {
    return !!(this.getClientId() && this.getClientSecret());
  }

  public getSanitizedRedirectUri(): string {
    return this.getRedirectUri();
  }

  public getScopes(): string[] {
    return [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];
  }

  /**
   * Generates Google OAuth 2.0 consent URL requesting minimum necessary Drive scope: drive.file
   * Enforces offline access, explicit consent (for refresh_token), and account chooser.
   */
  public generateAuthUrl(state: string): string {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured in backend environment.');
    }

    const redirectUri = this.getRedirectUri();
    const scopes = this.getScopes().join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent select_account', // Force consent screen to guarantee refresh_token AND force account picker to select dedicated account
      include_granted_scopes: 'true',
      state: state || 'admin_connect',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Safe parser and logger for Google API error responses.
   * Logs HTTP status, error reason, message, operation, email, and scopes.
   * NEVER logs access_token, refresh_token, or client_secret.
   */
  private parseGoogleApiError(
    status: number,
    statusText: string,
    rawBody: string,
    operation: string,
    accountEmail?: string
  ): { status: number; reason: string; message: string; operation: string; formattedError: string } {
    let reason = 'UNKNOWN_ERROR';
    let message = statusText || 'Unknown Google API error';

    try {
      const json = JSON.parse(rawBody);
      if (json.error) {
        message = json.error.message || message;
        reason =
          json.error.errors?.[0]?.reason ||
          json.error.details?.[0]?.reason ||
          json.error.status ||
          reason;
      }
    } catch {
      if (rawBody && rawBody.trim()) {
        message = rawBody.substring(0, 300);
      }
    }

    console.error(
      `[GoogleDriveService] Drive API failure -> Operation: ${operation}, HTTP: ${status}, Reason: ${reason}, Message: "${message}", Account: ${accountEmail || 'unknown'}`
    );

    return {
      status,
      reason,
      message,
      operation,
      formattedError: `Google Drive API error during ${operation} (HTTP ${status} ${reason}: ${message})`,
    };
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

    console.log(`[GoogleDriveService] Initiating token exchange. Redirect URI: ${redirectUri}, Code length: ${code.length}`);

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
      const status = tokenRes.status;
      let safeReason = tokenRes.statusText;
      let safeDesc = 'Token exchange failed';
      try {
        const errJson = await tokenRes.json();
        safeReason = errJson.error || safeReason;
        safeDesc = errJson.error_description || safeDesc;
      } catch {
        // body wasn't json
      }
      console.error(`[GoogleDriveService] Token exchange failed. HTTP ${status}, Reason: ${safeReason}, Desc: ${safeDesc}`);
      throw new Error(`Google OAuth token exchange failed (HTTP ${status} ${safeReason}: ${safeDesc})`);
    }

    const tokenData = await tokenRes.json();
    console.log('[GoogleDriveService] Token exchange status: success');
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresInSec = tokenData.expires_in || 3600;
    const expiryDate = Date.now() + (expiresInSec - 120) * 1000;
    const scopes: string[] = (tokenData.scope || '').split(' ').filter(Boolean);
    const tokenType = tokenData.token_type || 'Bearer';

    // 2. Fetch connected Google account email
    let email = 'ikshovia@gmail.com';
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userinfoRes.ok) {
        const userInfo = await userinfoRes.json();
        if (userInfo.email) email = userInfo.email;
      }
    } catch (uErr: any) {
      console.warn('[GoogleDriveService] Could not fetch user profile email:', uErr?.message);
    }

    // 3. Verify that Google Drive scopes were granted by user on consent screen
    const hasDriveScope = scopes.some((s: string) => s.toLowerCase().includes('drive'));
    console.log(
      `[GoogleDriveService] Token exchange completed. Account: ${email}, Scopes: [${scopes.join(', ')}], DriveScopeGranted: ${hasDriveScope}, RefreshTokenProvided: ${!!refreshToken}`
    );

    if (!hasDriveScope) {
      console.error(
        `[GoogleDriveService] Drive scope missing from authorization grant for ${email}. Granted scopes: [${scopes.join(', ')}]`
      );
      throw new Error(
        `Google Drive permission was not granted during authorization for ${email}. Granted scopes: [${scopes.join(', ')}]. ` +
        `On Google's consent screen, please make sure to check the box for "See, edit, create, and delete only the specific Google Drive files you use with this app". ` +
        `Also verify that Google Drive API is enabled and 'drive.file' scope is added under Data Access in Google Cloud Console project 407081249545.`
      );
    }

    // 4. Upsert integration into Postgres
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

    console.log(`[GoogleDriveService] oauth_integrations record persisted. Provider: google_drive, Account: ${email}, RefreshToken: ${!!finalRefreshToken}`);

    // 5. Ensure dedicated IKSHOVIA folders
    const folders = await this.ensureFolderStructure(accessToken);

    return { email, folders };
  }

  /**
   * Diagnostic summary for admin audit and troubleshooting
   */
  public async getDiagnostics() {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri();
    const projectNumberInClientId = clientId ? clientId.split('-')[0] : 'NOT_SET';
    const status = await this.getStatus();

    let dbRecordExists = false;
    let dbAccountEmail: string | null = null;
    let dbHasRefreshToken = false;
    let dbScopes: string[] = [];
    let dbHasDriveScope = false;
    let dbUpdatedAt = null;
    let liveDriveApiCheck: {
      tested: boolean;
      accessible: boolean;
      status?: number;
      reason?: string;
      message?: string;
      accountEmail?: string;
      scopes?: string[];
    } = { tested: false, accessible: false };

    try {
      const dbRes = await pool.query(
        "SELECT account_email, refresh_token, scopes, updated_at FROM public.oauth_integrations WHERE provider = 'google_drive'"
      );
      if (dbRes.rows.length > 0) {
        dbRecordExists = true;
        dbAccountEmail = dbRes.rows[0].account_email;
        dbHasRefreshToken = !!dbRes.rows[0].refresh_token;
        dbUpdatedAt = dbRes.rows[0].updated_at;
        const rawScopes = dbRes.rows[0].scopes;
        dbScopes = Array.isArray(rawScopes) ? rawScopes : (typeof rawScopes === 'string' ? rawScopes.split(' ') : []);
        dbHasDriveScope = dbScopes.some((s: string) => s.toLowerCase().includes('drive'));

        // Perform safe live diagnostic probe against Google Drive API (files.list with pageSize 1)
        try {
          const accessToken = await this.getValidAccessToken();
          const probeRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (probeRes.ok) {
            liveDriveApiCheck = {
              tested: true,
              accessible: true,
              status: probeRes.status,
              reason: 'SUCCESS',
              message: 'Google Drive API is responding normally with valid access credentials.',
              accountEmail: dbAccountEmail || undefined,
              scopes: dbScopes,
            };
          } else {
            const errRaw = await probeRes.text();
            const parsed = this.parseGoogleApiError(probeRes.status, probeRes.statusText, errRaw, 'DriveFiles.Probe', dbAccountEmail || undefined);
            liveDriveApiCheck = {
              tested: true,
              accessible: false,
              status: parsed.status,
              reason: parsed.reason,
              message: parsed.message,
              accountEmail: dbAccountEmail || undefined,
              scopes: dbScopes,
            };
          }
        } catch (probeErr: any) {
          liveDriveApiCheck = {
            tested: true,
            accessible: false,
            reason: 'TOKEN_OR_NETWORK_ERROR',
            message: probeErr?.message || 'Failed to test Drive API with current credentials',
            accountEmail: dbAccountEmail || undefined,
            scopes: dbScopes,
          };
        }
      }
    } catch (e: any) {
      console.warn('[GoogleDriveService] DB diagnostics check error:', e?.message);
    }

    return {
      configured: !!(clientId && clientSecret),
      clientIdConfigured: !!clientId,
      clientIdPrefix: clientId ? `${clientId.substring(0, 14)}...` : 'NOT_SET',
      projectNumberInClientId,
      expectedProjectNumber: '407081249545',
      expectedProjectId: 'ikshovia',
      expectedProjectName: 'IKSHOVIA',
      expectedClientName: 'IKSHOVIA Resource Manager',
      projectNumberMatchesExpected: projectNumberInClientId === '407081249545',
      clientSecretConfigured: !!clientSecret,
      clientSecretLength: clientSecret ? clientSecret.length : 0,
      redirectUri,
      expectedRedirectUri: 'https://ikshoviav3.onrender.com/api/auth/google/callback',
      redirectUriMatchesExpected: redirectUri === 'https://ikshoviav3.onrender.com/api/auth/google/callback',
      scopesRequested: this.getScopes(),
      databaseIntegration: {
        recordExists: dbRecordExists,
        accountEmail: dbAccountEmail,
        hasRefreshToken: dbHasRefreshToken,
        grantedScopes: dbScopes,
        hasDriveScope: dbHasDriveScope,
        updatedAt: dbUpdatedAt,
      },
      liveDriveApiCheck,
      driveStatus: status,
      prompt: 'consent select_account',
      testUsersGuidance: 'Project IKSHOVIA (ID: ikshovia, Project #: 407081249545) is the correct production project. Ensure the intended Google Drive account (ikshovia@gmail.com) is listed under Google Auth Platform -> Audience -> Test Users, and that "drive.file" scope is approved during OAuth consent.',
    };
  }

  /**
   * Retrieves a valid access token, auto-refreshing via refresh_token if expired.
   */
  public async getValidAccessToken(): Promise<string> {
    const res = await pool.query(
      "SELECT access_token, refresh_token, expiry_date, account_email FROM public.oauth_integrations WHERE provider = 'google_drive'"
    );

    if (res.rows.length === 0) {
      throw new Error('Google Drive integration is not connected. Please connect via Admin Studio.');
    }

    const { access_token, refresh_token, expiry_date, account_email } = res.rows[0];
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

    console.log(`[GoogleDriveService] Refreshing expired access token for account: ${account_email || 'unknown'}...`);
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
      const status = refreshRes.status;
      let reason = 'REFRESH_FAILED';
      let msg = refreshRes.statusText;
      try {
        const json = JSON.parse(errText);
        reason = json.error || reason;
        msg = json.error_description || msg;
      } catch {}
      console.error(`[GoogleDriveService] Refresh token failed. HTTP ${status}, Reason: ${reason}, Message: "${msg}", Account: ${account_email || 'unknown'}`);
      throw new Error(`Failed to refresh Google Drive access token (HTTP ${status} ${reason}: ${msg}). Please re-authenticate.`);
    }

    const refreshed = await refreshRes.json();
    const newAccessToken = refreshed.access_token;
    const expiresInSec = refreshed.expires_in || 3600;
    const newExpiry = Date.now() + (expiresInSec - 120) * 1000;
    const refreshedScopes = refreshed.scope ? refreshed.scope.split(' ').filter(Boolean) : null;

    console.log(
      `[GoogleDriveService] Token refresh successful. Account: ${account_email || 'unknown'}, Expires in: ${expiresInSec}s, Scopes: [${refreshedScopes ? refreshedScopes.join(', ') : 'preserved'}]`
    );

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
        "SELECT account_email, expiry_date, folders_json, scopes, root_folder_id, updated_at FROM public.oauth_integrations WHERE provider = 'google_drive'"
      );

      if (res.rows.length === 0) {
        return { connected: false };
      }

      const row = res.rows[0];
      const rawScopes = row.scopes;
      const scopes: string[] = Array.isArray(rawScopes) ? rawScopes : (typeof rawScopes === 'string' ? rawScopes.split(' ') : []);
      const hasDriveScope = scopes.some((s: string) => s.toLowerCase().includes('drive'));
      const hasFolders = !!(row.root_folder_id && row.folders_json);

      return {
        connected: hasDriveScope,
        accountEmail: row.account_email || 'Connected Account',
        folders: row.folders_json || undefined,
        lastSync: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
        hasDriveScope,
        grantedScopes: scopes,
        rootFolderCreated: !!row.root_folder_id,
        error: !hasDriveScope
          ? "Google Drive scope ('drive.file') is missing from authorization grant. Please click 'Connect Drive' and check the Drive permissions checkbox."
          : (!hasFolders ? "Google Drive folder structure is pending verification." : undefined),
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
    const booksId = await this.getOrCreateFolder('Books', resourcesId, accessToken);
    const officialDocsId = await this.getOrCreateFolder('Official-Documents', rootId, accessToken);
    const notesId = await this.getOrCreateFolder('IKSHOVIA-Notes', rootId, accessToken);

    const folders: DriveFolderStructure = {
      rootId,
      resourcesId,
      booksId,
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
    } else {
      const errRaw = await searchRes.text();
      this.parseGoogleApiError(searchRes.status, searchRes.statusText, errRaw, `DriveFiles.List[${folderName}]`);
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
      const errRaw = await createRes.text();
      const parsed = this.parseGoogleApiError(createRes.status, createRes.statusText, errRaw, `DriveFiles.Create[${folderName}]`);
      throw new Error(`Failed to create Google Drive folder '${folderName}' (${parsed.formattedError})`);
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
      const errRaw = await initRes.text();
      const parsed = this.parseGoogleApiError(initRes.status, initRes.statusText, errRaw, `DriveFiles.ResumableUploadInit[${fileName}]`);
      throw new Error(`Failed to initialize Google Drive resumable upload: ${parsed.formattedError}`);
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
      const errRaw = await uploadRes.text();
      const parsed = this.parseGoogleApiError(uploadRes.status, uploadRes.statusText, errRaw, `DriveFiles.ResumableUploadChunk[${fileName}]`);
      throw new Error(`Failed to upload file content to Google Drive: ${parsed.formattedError}`);
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
   * Returns a readable stream of the file content for secure server-side streaming,
   * with full HTTP Range support and upstream header propagation.
   */
  public async downloadFileStreamWithRange(
    fileId: string,
    rangeHeader?: string
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    stream: NodeJS.ReadableStream;
  }> {
    const accessToken = await this.getValidAccessToken();

    const fileUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const res = await fetch(fileUrl, {
      headers: fetchHeaders,
    });

    if (!res.ok || !res.body) {
      const errorText = await res.text().catch(() => res.statusText);
      throw new Error(`Failed to stream file from Google Drive (HTTP ${res.status}): ${errorText}`);
    }

    const headers: Record<string, string> = {};
    const trackedHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition', 'cache-control'];
    for (const h of trackedHeaders) {
      const val = res.headers.get(h);
      if (val) {
        headers[h] = val;
      }
    }

    return {
      status: res.status,
      headers,
      stream: Readable.fromWeb(res.body as any),
    };
  }

  /**
   * Returns a readable stream of the file content for secure server-side streaming
   */
  public async downloadFileStream(fileId: string): Promise<NodeJS.ReadableStream> {
    const res = await this.downloadFileStreamWithRange(fileId);
    return res.stream;
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
