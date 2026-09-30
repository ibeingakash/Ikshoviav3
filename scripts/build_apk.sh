#!/usr/bin/env bash
# Delegate to the permanent release APK build script
exec bash "$(dirname "$0")/build-release-apk.sh" "$@"
