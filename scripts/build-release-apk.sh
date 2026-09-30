#!/usr/bin/env bash
# ==============================================================================
# IKSHOVIA — PERMANENT ANDROID RELEASE APK BUILD & DISTRIBUTION SCRIPT
# ==============================================================================
# Single, repeatable command for building and publishing production-signed APKs.
# Every future release must be buildable with this script.
# ==============================================================================

set -euo pipefail

APP_ROOT="/app/applet"
cd "$APP_ROOT"

echo "=================================================="
echo "IKSHOVIA RELEASE APK BUILD — v3.0 (BUILD 9)"
echo "=================================================="

# 1. Ensure OpenJDK 21 and Android SDK
echo "--> 1. Verifying Java 21 and Android SDK..."
while fuser /var/lib/apt/lists/lock >/dev/null 2>&1 || fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
  echo "    Waiting for background apt/dpkg lock to release..."
  sleep 2
done

if ! command -v java >/dev/null 2>&1 || ! java -version 2>&1 | grep -q "21\."; then
  echo "    Installing OpenJDK 21 headless via apt..."
  mkdir -p /var/cache/apt/archives/partial
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends openjdk-21-jdk-headless unzip curl
fi

if [ -d "/usr/lib/jvm/java-21-openjdk-amd64" ]; then
  export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
elif [ -d "/usr/lib/jvm/java-21-openjdk-arm64" ]; then
  export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-arm64"
else
  export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
fi
export PATH="$JAVA_HOME/bin:$PATH"
echo "    Using JAVA_HOME: $JAVA_HOME"

SDK_DIR="$APP_ROOT/.tools/android-sdk"
mkdir -p "$SDK_DIR/cmdline-tools/latest"

if [ ! -f "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "    Downloading Android Commandline Tools..."
  curl -sS --retry 3 --retry-delay 2 -o /tmp/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  mkdir -p /tmp/cmdline-tools-extracted
  unzip -q -o /tmp/cmdline-tools.zip -d /tmp/cmdline-tools-extracted
  mkdir -p "$SDK_DIR/cmdline-tools/latest"
  cp -r /tmp/cmdline-tools-extracted/cmdline-tools/* "$SDK_DIR/cmdline-tools/latest/"
  rm -rf /tmp/cmdline-tools*
  chmod +x "$SDK_DIR/cmdline-tools/latest/bin/"*
fi

export ANDROID_HOME="$SDK_DIR"
export PATH="$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$SDK_DIR/build-tools/36.0.0:$SDK_DIR/build-tools/35.0.0:$PATH"

if [ ! -d "$SDK_DIR/platforms/android-36" ] || [ ! -d "$SDK_DIR/build-tools/35.0.0" ]; then
  echo "    Installing Android SDK Platform 36 and Build-Tools..."
  yes | "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK_DIR" --licenses >/dev/null 2>&1 || true
  "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK_DIR" "platforms;android-36" "build-tools;35.0.0" "platform-tools"
fi

echo "sdk.dir=$SDK_DIR" > "$APP_ROOT/android/local.properties"

# 2. Permanent Release Keystore Management
echo "--> 2. Configuring Permanent Release Signing Identity from persistent environment..."
if [ -z "${ANDROID_KEYSTORE_BASE64:-}" ]; then
  echo "ERROR: ANDROID_KEYSTORE_BASE64 environment variable is missing!"
  exit 1
fi
if [ -z "${ANDROID_KEYSTORE_PASSWORD:-}" ] || [ -z "${ANDROID_KEY_ALIAS:-}" ] || [ -z "${ANDROID_KEY_PASSWORD:-}" ]; then
  echo "ERROR: Android signing credential environment variables (ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD) are missing!"
  exit 1
fi

TEMP_KEYSTORE_DIR="/tmp/ikshovia-signing"
mkdir -p "$TEMP_KEYSTORE_DIR"
chmod 700 "$TEMP_KEYSTORE_DIR"
KEYSTORE_PATH="$TEMP_KEYSTORE_DIR/ikshovia-release.keystore"

node -e '
const fs = require("fs");
const b64 = process.env.ANDROID_KEYSTORE_BASE64;
if (!b64) throw new Error("Missing ANDROID_KEYSTORE_BASE64");
fs.writeFileSync("'$KEYSTORE_PATH'", Buffer.from(b64.trim(), "base64"));
'
chmod 600 "$KEYSTORE_PATH"

PROPS_FILE="$APP_ROOT/android/release-keystore.properties"
cat > "$PROPS_FILE" <<EOF
MYAPP_RELEASE_STORE_FILE=$KEYSTORE_PATH
MYAPP_RELEASE_STORE_PASSWORD=$ANDROID_KEYSTORE_PASSWORD
MYAPP_RELEASE_KEY_ALIAS=$ANDROID_KEY_ALIAS
MYAPP_RELEASE_KEY_PASSWORD=$ANDROID_KEY_PASSWORD
EOF
chmod 600 "$PROPS_FILE"

export MYAPP_RELEASE_STORE_FILE="$KEYSTORE_PATH"
export MYAPP_RELEASE_STORE_PASSWORD="$ANDROID_KEYSTORE_PASSWORD"
export MYAPP_RELEASE_KEY_ALIAS="$ANDROID_KEY_ALIAS"
export MYAPP_RELEASE_KEY_PASSWORD="$ANDROID_KEY_PASSWORD"
export ANDROID_KEYSTORE_FILE="$KEYSTORE_PATH"

# Extract certificate fingerprint without revealing secrets
echo "    Extracting certificate fingerprint..."
CERT_SHA256=$(node -e '
const { execSync } = require("child_process");
const out = execSync(`keytool -list -v -keystore "'$KEYSTORE_PATH'" -alias "'$ANDROID_KEY_ALIAS'" -storepass "'$ANDROID_KEYSTORE_PASSWORD'"`, {encoding: "utf8"});
const m = out.match(/SHA256:\s*([A-Fa-f0-9:]+)/);
console.log(m ? m[1] : "UNKNOWN");
')
echo "    Permanent Certificate Fingerprint SHA-256: $CERT_SHA256"

# 3. Build Web Assets and Sync with Capacitor
echo "--> 3. Building Vite web distribution and syncing Capacitor..."
npm run build
rm -rf "$APP_ROOT/dist/apk"
npx cap sync android

# Crucial: remove Node.js server bundles if copied into Android assets
rm -rf "$APP_ROOT/android/app/src/main/assets/public/apk"
rm -f "$APP_ROOT/android/app/src/main/assets/public/server.cjs"*
rm -f "$APP_ROOT/android/app/src/main/assets/public/"*.map
find "$APP_ROOT/android/app/src/main/assets/public" -name "*.map" -delete || true

# 4. Clean prior APK outputs
rm -f "$APP_ROOT/android/app/build/outputs/apk/release/"*.apk

# 5. Build Release APK with Gradle
echo "--> 4. Compiling signed release APK with Gradle..."
cd "$APP_ROOT/android"
chmod +x gradlew
./gradlew --stop || true
./gradlew :app:assembleRelease -PversionCode=9 -PversionName=3.0
./gradlew --stop || true
cd "$APP_ROOT"

# 6. Locate generated release APK
GENERATED_APK=$(find "$APP_ROOT/android/app/build/outputs/apk/release" -name "*.apk" | head -n 1)
if [ -z "$GENERATED_APK" ] || [ ! -f "$GENERATED_APK" ]; then
  echo "ERROR: Release APK was not generated!"
  exit 1
fi

echo "--> 5. Release APK generated: $GENERATED_APK"
ls -lh "$GENERATED_APK"

# 7. Distribution paths
echo "--> 6. Publishing APK to web distribution locations..."
mkdir -p "$APP_ROOT/public/apk" "$APP_ROOT/dist/apk"

# Preserve historical releases: do NOT overwrite ikshovia-v2.2-b8.apk or ikshovia-v2.2.apk
# Publish new v3.0 Build 9 artifacts
cp "$GENERATED_APK" "$APP_ROOT/public/apk/ikshovia-release.apk"
cp "$GENERATED_APK" "$APP_ROOT/public/apk/ikshovia-v3.0.apk"
cp "$GENERATED_APK" "$APP_ROOT/public/apk/ikshovia-v3.0-b9.apk"
cp "$GENERATED_APK" "$APP_ROOT/public/apk/app-release.apk"
cp "$GENERATED_APK" "$APP_ROOT/dist/apk/ikshovia-release.apk"
cp "$GENERATED_APK" "$APP_ROOT/dist/apk/ikshovia-v3.0.apk"
cp "$GENERATED_APK" "$APP_ROOT/dist/apk/ikshovia-v3.0-b9.apk"
cp "$GENERATED_APK" "$APP_ROOT/dist/apk/app-release.apk"

APK_SIZE=$(stat -c%s "$GENERATED_APK")
APK_SHA256=$(sha256sum "$GENERATED_APK" | awk '{print $1}')
RELEASE_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "    APK File Size: $APK_SIZE bytes ($((APK_SIZE / 1024 / 1024)) MB)"
echo "    APK SHA-256 Checksum: $APK_SHA256"

# 8. Update Release Metadata Files
echo "--> 7. Writing release metadata..."
node -e '
const fs = require("fs");
if (process.env.KEEP_PROD_METADATA === "1") {
  console.log("    (Preserving production release metadata)");
  process.exit(0);
}
const metadata = {
  versionName: "3.0",
  versionCode: 9,
  minSupportedVersionCode: 8,
  releaseDate: "'$RELEASE_DATE'",
  fileSizeBytes: '$APK_SIZE',
  sha256Checksum: "'$APK_SHA256'",
  certificateSha256: "'$CERT_SHA256'",
  signingIdentity: "permanent_release_v2",
  downloadUrl: "https://ikshoviacse.onrender.com/api/app/download/latest",
  apkUrl: "https://ikshoviacse.onrender.com/api/app/download/latest",
  updateType: "OPTIONAL",
  releaseNotes: "IKSHOVIA v3.0 Official Production Release (Build 9) with Permanent Signing Identity.\n\n• Complete Phase 1, Phase 2, and Phase 3 unified learning intelligence platform.\n• Unified Prelims → Mains → Interview Preparation Engine.\n• Personalized Study Planner with syllabus-linked schedules & dynamic completion queues.\n• SM-2 Smart Revision Engine with deterministic interval tracking & retention curves.\n• Topic & Concept Mastery Engine powered by real question attempt telemetry.\n• Current Affairs Intelligence linking real-time news to syllabus themes and PYQs.\n• Mains Answer Improvement Loop with multi-attempt trajectory and rubric breakdown.\n• Cross-stage learner analytics and personalized AI Tutor context.\n• Verified in-place upgrade from v2.2 Build 8 under permanent signing key."
};
fs.writeFileSync("/app/applet/public/apk/release-metadata.json", JSON.stringify(metadata, null, 2));
fs.writeFileSync("/app/applet/dist/apk/release-metadata.json", JSON.stringify(metadata, null, 2));
console.log("    ✓ release-metadata.json updated in public/ and dist/");
'

# 9. Synchronize PostgreSQL database if available
echo "--> 8. Synchronizing database release table..."
node -e '
const { Pool } = require("pg");
const fs = require("fs");

async function syncDb() {
  if (process.env.SKIP_DB_SYNC === "1") {
    console.log("    (Skipping DB sync)");
    return;
  }
  const connStr = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.PGURL;
  if (!connStr) {
    console.log("    (No direct DATABASE_URL; file-based fallback is active)");
    return;
  }
  const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.app_releases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        platform TEXT NOT NULL,
        version_name TEXT NOT NULL,
        version_code INTEGER NOT NULL,
        min_supported_version_code INTEGER NOT NULL DEFAULT 6,
        apk_url TEXT NOT NULL,
        sha256_checksum TEXT NOT NULL,
        file_size_bytes BIGINT NOT NULL,
        release_notes TEXT,
        is_mandatory BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT '\''PUBLISHED'\'',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    // Archive older releases so only Build 9 is active PUBLISHED release
    await pool.query(`UPDATE public.app_releases SET status = '\''ARCHIVED'\'' WHERE platform = '\''android'\'' AND status = '\''PUBLISHED'\'';`);
    await pool.query(`
      INSERT INTO public.app_releases (
        id, platform, version_name, version_code, min_supported_version_code,
        apk_url, sha256_checksum, file_size_bytes, release_notes, is_mandatory, status
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, '\''PUBLISHED'\''
      )
    `, [
      "android",
      "3.0",
      9,
      8,
      "/api/app/download/latest",
      "'$APK_SHA256'",
      '$APK_SIZE',
      "IKSHOVIA v3.0 Official Production Release (Build 9) with Permanent Signing Identity.\n\n• Unified Prelims → Mains → Interview Engine with cross-stage readiness tracking.\n• Personalized Study Planner with syllabus-linked schedules and dynamic completion queues.\n• SM-2 Smart Revision Engine with deterministic interval tracking & retention curves.\n• Topic & Concept Mastery Engine powered by real question attempt telemetry.\n• Current Affairs Intelligence linking real-time news to syllabus themes and PYQs.\n• Mains Answer Improvement Loop with multi-attempt trajectory and rubric breakdown.\n• Personalized AI Tutor context grounded in student mastery and weak areas.\n• Next Best Action intelligence engine for optimized daily learning.\n• In-place upgrade from v2.2 Build 8 under verified permanent signing key.",
      false
    ]);
    console.log("    ✓ Inserted v3.0 build 9 into public.app_releases with min_supported_version_code = 8");
  } catch (err) {
    console.log("    Note on DB sync:", err.message);
  } finally {
    await pool.end();
  }
}
syncDb();
' || true

# 10. Verify APK with zipalign and apksigner
echo "--> 9. Verifying signed APK with zipalign and apksigner..."
ZIPALIGN_BIN=$(find "$SDK_DIR" -name "zipalign" 2>/dev/null | head -n 1)
if [ -n "$ZIPALIGN_BIN" ] && [ -x "$ZIPALIGN_BIN" ]; then
  echo "    Running zipalign verification:"
  "$ZIPALIGN_BIN" -c -v 4 "$GENERATED_APK"
fi

APKSIGNER_BIN=$(find "$SDK_DIR" -name "apksigner" 2>/dev/null | head -n 1)
if [ -n "$APKSIGNER_BIN" ] && [ -x "$APKSIGNER_BIN" ]; then
  echo "    Running apksigner verification:"
  "$APKSIGNER_BIN" verify --verbose --print-certs "$GENERATED_APK"
fi

# 11. Securely remove temporary keystore and temporary properties
echo "--> 10. Cleaning temporary keystore material..."
rm -rf "$TEMP_KEYSTORE_DIR"
rm -f "$PROPS_FILE"
echo "    ✓ Temporary keystore material removed."

echo "=================================================="
echo "BUILD & DISTRIBUTION SUCCESSFUL!"
echo "Package ID: com.ikshovia.app"
echo "Version: v3.0 (Build 9)"
echo "APK Path: public/apk/ikshovia-v3.0-b9.apk"
echo "SHA-256: $APK_SHA256"
echo "Cert SHA-256: $CERT_SHA256"
echo "=================================================="
