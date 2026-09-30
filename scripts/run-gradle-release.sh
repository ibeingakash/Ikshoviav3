#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/app/applet"
cd "$APP_ROOT"

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

export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
export PATH="$JAVA_HOME/bin:/usr/bin:/bin:$PATH"

SDK_DIR="$APP_ROOT/.tools/android-sdk"
export ANDROID_HOME="$SDK_DIR"
export PATH="$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$SDK_DIR/build-tools/35.0.0:$PATH"
echo "sdk.dir=$SDK_DIR" > "$APP_ROOT/android/local.properties"

cd "$APP_ROOT/android"
chmod +x gradlew

echo "--> Starting Gradle assembleRelease..."
./gradlew :app:assembleRelease -PversionCode=9 -PversionName=3.0 --stacktrace

echo "--> Gradle assembleRelease finished with exit code $?"
ls -lh "$APP_ROOT/android/app/build/outputs/apk/release/"*.apk
