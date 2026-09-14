#!/usr/bin/env bash
set -e

echo "=== 0. Syncing Web Assets with Capacitor ==="
cd /app/applet
npm run build
npx cap sync android

# Clean any existing old APKs to prevent stale files
rm -f /app/applet/app-debug.apk /app/applet/public/apk/app-debug.apk /app/applet/android/app/build/outputs/apk/debug/*.apk || true

echo "=== 1. Setting up Java 21 ==="
if [ ! -f /opt/jdk-21/bin/java ]; then
  echo "Downloading OpenJDK 21..."
  mkdir -p /opt/jdk-21
  curl -L -sS https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.6%2B7/OpenJDK21U-jdk_x64_linux_hotspot_21.0.6_7.tar.gz | tar -xz -C /opt/jdk-21 --strip-components=1
fi

export JAVA_HOME=/opt/jdk-21
export PATH=/opt/jdk-21/bin:$PATH
java -version

echo "=== 2. Setting up Android SDK ==="
export ANDROID_HOME=/opt/android-sdk
mkdir -p /opt/android-sdk/cmdline-tools/latest

if [ ! -f /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager ]; then
  echo "Downloading Android Commandline Tools..."
  curl -sS -o /tmp/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  python3 -c "import zipfile; zipfile.ZipFile('/tmp/cmdline-tools.zip').extractall('/tmp/cmdline-tools')"
  mv /tmp/cmdline-tools/cmdline-tools/* /opt/android-sdk/cmdline-tools/latest/
  rm -rf /tmp/cmdline-tools*
  chmod +x /opt/android-sdk/cmdline-tools/latest/bin/*
fi

export PATH=/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:$PATH

echo "Accepting Android SDK licenses..."
yes | sdkmanager --sdk_root=/opt/android-sdk --licenses >/dev/null 2>&1 || true

if [ ! -d /opt/android-sdk/platforms/android-36 ] || [ ! -d /opt/android-sdk/build-tools/36.0.0 ]; then
  echo "Installing Android 36 SDK and Build Tools..."
  sdkmanager --sdk_root=/opt/android-sdk "platforms;android-36" "build-tools;36.0.0"
fi

echo "=== 3. Configuring local.properties ==="
echo "sdk.dir=/opt/android-sdk" > /app/applet/android/local.properties

echo "=== 4. Building DEBUG APK with Gradle ==="
cd /app/applet/android
chmod +x gradlew
./gradlew :app:assembleDebug --no-daemon --stacktrace

echo "=== 5. Stopping Gradle Daemon to release RAM ==="
./gradlew --stop || true

echo "=== 6. Verifying Debug APK Output ==="
APK_FILE=$(find app/build/outputs/apk/debug -name "*.apk" | head -n 1)
if [ -n "$APK_FILE" ] && [ -f "$APK_FILE" ]; then
  echo "DEBUG_APK_SUCCESS: $APK_FILE"
  ls -lh "$APK_FILE"
  mkdir -p /app/applet/public/apk
  cp "$APK_FILE" /app/applet/app-debug.apk
  cp "$APK_FILE" /app/applet/public/apk/app-debug.apk
  echo "COPIED_TO_ROOT: /app/applet/app-debug.apk"
  echo "COPIED_TO_PUBLIC: /app/applet/public/apk/app-debug.apk"
else
  echo "ERROR: Debug APK not found!"
  exit 1
fi
