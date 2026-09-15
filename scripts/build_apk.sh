#!/usr/bin/env bash
set -e

echo "=== 0. Syncing Web Assets with Capacitor ==="
cd /app/applet
npm run build
npx cap sync android

# Clean any existing old APKs from build outputs
rm -f /app/applet/public/apk/app-debug.apk /app/applet/dist/apk/app-debug.apk /app/applet/android/app/build/outputs/apk/debug/*.apk || true

TOOLS_DIR="/app/applet/.tools"
mkdir -p "$TOOLS_DIR"

echo "=== 1. Setting up Java 21 ==="
JAVA_DIR="$TOOLS_DIR/jdk-21"
if [ ! -f "$JAVA_DIR/bin/java" ]; then
  echo "Downloading OpenJDK 21 into $JAVA_DIR..."
  mkdir -p "$JAVA_DIR"
  curl -L -sS https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.6%2B7/OpenJDK21U-jdk_x64_linux_hotspot_21.0.6_7.tar.gz | tar -xz -C "$JAVA_DIR" --strip-components=1
fi

export JAVA_HOME="$JAVA_DIR"
export PATH="$JAVA_DIR/bin:$PATH"
java -version

echo "=== 2. Setting up Android SDK ==="
SDK_DIR="$TOOLS_DIR/android-sdk"
mkdir -p "$SDK_DIR/cmdline-tools/latest"

if [ ! -f "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "Downloading Android Commandline Tools..."
  curl -sS -o /tmp/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  python3 -c "import zipfile; zipfile.ZipFile('/tmp/cmdline-tools.zip').extractall('/tmp/cmdline-tools')"
  mv /tmp/cmdline-tools/cmdline-tools/* "$SDK_DIR/cmdline-tools/latest/"
  rm -rf /tmp/cmdline-tools*
  chmod +x "$SDK_DIR/cmdline-tools/latest/bin/"*
fi

export ANDROID_HOME="$SDK_DIR"
export PATH="$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$PATH"

echo "Accepting Android SDK licenses..."
yes | sdkmanager --sdk_root="$SDK_DIR" --licenses >/dev/null 2>&1 || true

if [ ! -d "$SDK_DIR/platforms/android-36" ] || [ ! -d "$SDK_DIR/build-tools/36.0.0" ]; then
  echo "Installing Android 36 SDK and Build Tools..."
  sdkmanager --sdk_root="$SDK_DIR" "platforms;android-36" "build-tools;36.0.0"
fi

echo "=== 3. Configuring local.properties ==="
echo "sdk.dir=$SDK_DIR" > /app/applet/android/local.properties

echo "=== 4. Building DEBUG APK with Gradle ==="
cd /app/applet/android
chmod +x gradlew
./gradlew --stop || true
./gradlew :app:assembleDebug --no-daemon --stacktrace -Dorg.gradle.jvmargs="-Xmx768m -XX:+UseSerialGC -XX:MaxMetaspaceSize=256m"

echo "=== 5. Stopping Gradle Daemon to release RAM ==="
./gradlew --stop || true

echo "=== 6. Verifying Debug APK Output ==="
APK_FILE=$(find app/build/outputs/apk/debug -name "*.apk" | head -n 1)
if [ -n "$APK_FILE" ] && [ -f "$APK_FILE" ]; then
  echo "DEBUG_APK_SUCCESS: $APK_FILE"
  ls -lh "$APK_FILE"
  mkdir -p /app/applet/public/apk /app/applet/dist/apk
  cp "$APK_FILE" /app/applet/public/apk/app-debug.apk
  cp "$APK_FILE" /app/applet/dist/apk/app-debug.apk
  echo "COPIED_TO_PUBLIC: /app/applet/public/apk/app-debug.apk"
  echo "COPIED_TO_DIST: /app/applet/dist/apk/app-debug.apk"
  echo "SHA256 CHECKSUM:"
  sha256sum /app/applet/public/apk/app-debug.apk
else
  echo "ERROR: Debug APK not found!"
  exit 1
fi
