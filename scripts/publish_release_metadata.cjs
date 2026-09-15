/**
 * publish_release_metadata.cjs
 *
 * Invoked by GitHub Actions after Android APK build succeeds.
 * Calculates exact APK metrics (SHA-256, size in bytes) and safely records
 * the new release in the IKSHOVIA distribution and in-app update system.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  console.log('=== IKSHOVIA CI Release Publisher ===');

  const projectRoot = process.cwd();

  // Locate the freshly built APK
  const possiblePaths = [
    process.env.APK_PATH,
    path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
    path.join(projectRoot, 'public', 'apk', 'app-debug.apk'),
  ].filter(Boolean);

  let apkPath = null;
  for (const candidate of possiblePaths) {
    if (fs.existsSync(candidate)) {
      apkPath = candidate;
      break;
    }
  }

  if (!apkPath) {
    console.error('❌ Error: No built APK file found at candidate paths:');
    possiblePaths.forEach(p => console.error('  - ' + p));
    process.exit(1);
  }

  const stat = fs.statSync(apkPath);
  const fileSizeBytes = stat.size;
  const buffer = fs.readFileSync(apkPath);
  const sha256Checksum = crypto.createHash('sha256').update(buffer).digest('hex');

  const runNumber = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);
  const versionCode = parseInt(process.env.VERSION_CODE || String(1 + runNumber), 10);
  const versionName = process.env.VERSION_NAME || `1.1.${runNumber}`;
  const minSupportedVersionCode = parseInt(process.env.MIN_SUPPORTED_VERSION_CODE || '1', 10);
  const isMandatory = process.env.IS_MANDATORY === 'true';
  const repository = process.env.GITHUB_REPOSITORY || 'ikshovia/ikshovia';

  // Default APK download URL points to the GitHub Release asset or direct server download
  const apkDownloadUrl = process.env.APK_DOWNLOAD_URL ||
    `https://github.com/${repository}/releases/download/v${versionName}/app-debug.apk`;

  const releaseNotes = process.env.RELEASE_NOTES ||
    `- Automated CI Production Build v${versionName} (build ${versionCode})\n` +
    `- Synchronized with https://ikshovia.onrender.com backend\n` +
    `- Native Capacitor 8 offline-ready engine and live update system`;

  const releasePayload = {
    id: `rel_android_${versionCode}_${Date.now()}`,
    platform: 'android',
    version_name: versionName,
    version_code: versionCode,
    min_supported_version_code: minSupportedVersionCode,
    apk_url: apkDownloadUrl,
    sha256_checksum: sha256Checksum,
    file_size_bytes: fileSizeBytes,
    file_size_mb: (fileSizeBytes / (1024 * 1024)).toFixed(2),
    release_notes: releaseNotes,
    is_mandatory: isMandatory,
    status: 'PUBLISHED',
    created_at: new Date().toISOString()
  };

  console.log('✅ Real APK Verified:');
  console.log(`   Path: ${apkPath}`);
  console.log(`   Size: ${fileSizeBytes} bytes (${releasePayload.file_size_mb} MB)`);
  console.log(`   SHA-256: ${sha256Checksum}`);
  console.log(`   Version: ${versionName} (versionCode: ${versionCode})`);
  console.log(`   Download URL: ${apkDownloadUrl}`);

  // 1. Write release metadata to public/apk/release-metadata.json
  const publicApkDir = path.join(projectRoot, 'public', 'apk');
  fs.mkdirSync(publicApkDir, { recursive: true });
  fs.writeFileSync(
    path.join(publicApkDir, 'release-metadata.json'),
    JSON.stringify(releasePayload, null, 2),
    'utf8'
  );
  console.log('💾 Written metadata to public/apk/release-metadata.json');

  // Also copy APK to public/apk/app-debug.apk for local/self-hosted distribution
  try {
    const destApk = path.join(publicApkDir, 'app-debug.apk');
    if (path.resolve(apkPath) !== path.resolve(destApk)) {
      fs.copyFileSync(apkPath, destApk);
      console.log('📦 Copied APK to public/apk/app-debug.apk');
    }
  } catch (err) {
    console.warn('⚠️ Note: Could not copy APK to public dir (non-fatal):', err.message);
  }

  // 2. Publish to Database directly if DATABASE_URL is available
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (dbUrl) {
    try {
      console.log('🔌 Connecting to PostgreSQL to register release...');
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      await pool.query(`
        UPDATE public.app_releases
        SET status = 'ARCHIVED'
        WHERE platform = 'android' AND status = 'PUBLISHED';
      `);

      await pool.query(`
        INSERT INTO public.app_releases (
          id, platform, version_name, version_code, min_supported_version_code,
          apk_url, sha256_checksum, file_size_bytes, release_notes, is_mandatory, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (id) DO UPDATE SET
          version_name = EXCLUDED.version_name,
          version_code = EXCLUDED.version_code,
          min_supported_version_code = EXCLUDED.min_supported_version_code,
          apk_url = EXCLUDED.apk_url,
          sha256_checksum = EXCLUDED.sha256_checksum,
          file_size_bytes = EXCLUDED.file_size_bytes,
          release_notes = EXCLUDED.release_notes,
          is_mandatory = EXCLUDED.is_mandatory,
          status = 'PUBLISHED';
      `, [
        releasePayload.id,
        'android',
        versionName,
        versionCode,
        minSupportedVersionCode,
        apkDownloadUrl,
        sha256Checksum,
        fileSizeBytes,
        releaseNotes,
        isMandatory,
        'PUBLISHED'
      ]);

      await pool.end();
      console.log('✅ Successfully registered release in production PostgreSQL database!');
    } catch (dbErr) {
      console.warn('⚠️ Database registration warning:', dbErr.message);
    }
  }

  // 3. Publish via HTTP API to production server if secret is available
  const prodApiUrl = process.env.PROD_API_URL || 'https://ikshovia.onrender.com';
  const ciSecret = process.env.CI_RELEASE_SECRET || process.env.ADMIN_API_KEY || process.env.AUTH_SECRET;

  if (ciSecret && prodApiUrl) {
    try {
      console.log(`🌐 Notifying production API at ${prodApiUrl}/api/releases/ci-publish...`);
      const res = await fetch(`${prodApiUrl}/api/releases/ci-publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ciSecret}`
        },
        body: JSON.stringify(releasePayload),
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        console.log('✅ Successfully notified production API of new release!');
      } else {
        const text = await res.text();
        console.warn(`⚠️ API response: ${res.status} - ${text}`);
      }
    } catch (httpErr) {
      console.warn('⚠️ Production API notification warning:', httpErr.message);
    }
  }

  // 4. Output GitHub Actions step summary if running in GHA
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = `
### 🚀 IKSHOVIA Android APK Release Summary
| Attribute | Value |
|---|---|
| **Version Name** | \`${versionName}\` |
| **Version Code** | \`${versionCode}\` |
| **Package ID** | \`com.ikshovia.app\` |
| **File Size** | \`${fileSizeBytes.toLocaleString()} bytes (${releasePayload.file_size_mb} MB)\` |
| **SHA-256 Checksum** | \`${sha256Checksum}\` |
| **Download URL** | [Direct APK Download](${apkDownloadUrl}) |
| **In-App Update** | Enabled (\`https://ikshovia.onrender.com/api/app/version/latest\`) |
`;
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, 'utf8');
  }

  console.log('🎉 Release publishing process completed.');
}

main().catch((err) => {
  console.error('Fatal error publishing release:', err);
  process.exit(1);
});
