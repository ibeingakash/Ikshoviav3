package com.ikshovia.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.util.Log;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

@CapacitorPlugin(name = "ApkDownloader")
public class ApkDownloaderPlugin extends Plugin {

    private static final String TAG = "ApkDownloaderPlugin";
    private static final String DEFAULT_APK_NAME = "ikshovia-v2.1.apk";
    private static final String DEFAULT_URL = "https://ikshoviacse.onrender.com/api/app/download/latest";

    /**
     * Check if app has permission to install unknown apps (Android 8.0+)
     */
    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                boolean canInstall = getContext().getPackageManager().canRequestPackageInstalls();
                ret.put("canInstall", canInstall);
            } else {
                ret.put("canInstall", true);
            }
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error checking package install permission", e);
            ret.put("canInstall", true);
            call.resolve(ret);
        }
    }

    /**
     * Launch Android system settings to allow installing apps from this source
     */
    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("opened", true);
                call.resolve(ret);
            } else {
                JSObject ret = new JSObject();
                ret.put("opened", false);
                ret.put("message", "Unknown app sources permission not required on this Android version");
                call.resolve(ret);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error opening install permission settings", e);
            call.reject("Could not open install settings: " + e.getMessage(), e);
        }
    }

    /**
     * Start APK download via Android DownloadManager
     */
    @PluginMethod
    public void startDownload(PluginCall call) {
        String url = call.getString("url", DEFAULT_URL);
        String fileName = call.getString("fileName", DEFAULT_APK_NAME);

        try {
            Context context = getContext();
            DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) {
                call.reject("Android DownloadManager service is not available on this device");
                return;
            }

            File targetDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (targetDir != null && !targetDir.exists()) {
                targetDir.mkdirs();
            }
            File existingFile = new File(targetDir, fileName);
            if (existingFile.exists()) {
                boolean deleted = existingFile.delete();
                Log.d(TAG, "Existing destination APK removed: " + deleted);
            }

            Uri downloadUri = Uri.parse(url);
            DownloadManager.Request request = new DownloadManager.Request(downloadUri);
            request.setTitle("IKSHOVIA Update");
            request.setDescription("Downloading IKSHOVIA APK (" + fileName + ")...");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, fileName);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);

            long downloadId = dm.enqueue(request);

            Log.i(TAG, "Download enqueued with ID: " + downloadId + " for URL: " + url);

            JSObject ret = new JSObject();
            ret.put("downloadId", downloadId);
            ret.put("status", "PENDING");
            ret.put("fileName", fileName);
            ret.put("targetPath", existingFile.getAbsolutePath());
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to enqueue download via DownloadManager", e);
            call.reject("Failed to enqueue download: " + e.getMessage(), e);
        }
    }

    /**
     * Query DownloadManager for current download status and progress
     */
    @PluginMethod
    public void checkDownloadStatus(PluginCall call) {
        Long downloadId = call.getLong("downloadId");
        String fileName = call.getString("fileName", DEFAULT_APK_NAME);
        if (downloadId == null) {
            call.reject("downloadId is required");
            return;
        }

        try {
            Context context = getContext();
            DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) {
                call.reject("DownloadManager service not available");
                return;
            }

            DownloadManager.Query query = new DownloadManager.Query();
            query.setFilterById(downloadId);
            Cursor cursor = dm.query(query);

            JSObject ret = new JSObject();
            ret.put("downloadId", downloadId);

            File targetFile = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName);
            ret.put("filePath", targetFile.getAbsolutePath());

            if (cursor != null && cursor.moveToFirst()) {
                int bytesDownloadedIdx = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                int totalBytesIdx = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
                int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                int reasonIdx = cursor.getColumnIndex(DownloadManager.COLUMN_REASON);
                int localUriIdx = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);

                int status = statusIdx >= 0 ? cursor.getInt(statusIdx) : 0;
                long bytesDownloaded = bytesDownloadedIdx >= 0 ? cursor.getLong(bytesDownloadedIdx) : 0;
                long totalBytes = totalBytesIdx >= 0 ? cursor.getLong(totalBytesIdx) : 0;
                int reason = reasonIdx >= 0 ? cursor.getInt(reasonIdx) : 0;
                String localUri = localUriIdx >= 0 ? cursor.getString(localUriIdx) : null;
                cursor.close();

                int percent = 0;
                if (totalBytes > 0) {
                    percent = (int) Math.min(100, Math.max(0, (bytesDownloaded * 100) / totalBytes));
                }

                ret.put("bytesDownloaded", bytesDownloaded);
                ret.put("totalBytes", totalBytes);
                ret.put("percent", percent);
                ret.put("reasonCode", reason);
                if (localUri != null) {
                    ret.put("localUri", localUri);
                }

                switch (status) {
                    case DownloadManager.STATUS_PENDING:
                        ret.put("status", "PENDING");
                        ret.put("message", "Download queued in Android system...");
                        break;
                    case DownloadManager.STATUS_RUNNING:
                        ret.put("status", "RUNNING");
                        ret.put("message", "Downloading IKSHOVIA (" + percent + "%)...");
                        break;
                    case DownloadManager.STATUS_PAUSED:
                        ret.put("status", "PAUSED");
                        ret.put("message", "Download paused: " + getPausedReasonText(reason));
                        break;
                    case DownloadManager.STATUS_SUCCESSFUL:
                        ret.put("status", "SUCCESSFUL");
                        ret.put("percent", 100);
                        ret.put("fileExists", targetFile.exists());
                        ret.put("fileSize", targetFile.length());
                        ret.put("message", "Download complete.");
                        break;
                    case DownloadManager.STATUS_FAILED:
                        ret.put("status", "FAILED");
                        ret.put("message", "Download failed: " + getFailedReasonText(reason));
                        break;
                    default:
                        ret.put("status", "UNKNOWN");
                        ret.put("message", "Download status unknown");
                        break;
                }
                call.resolve(ret);
            } else {
                if (cursor != null) cursor.close();
                // Check if file exists on disk already
                if (targetFile.exists() && targetFile.length() > 0) {
                    ret.put("status", "SUCCESSFUL");
                    ret.put("percent", 100);
                    ret.put("fileExists", true);
                    ret.put("fileSize", targetFile.length());
                    ret.put("message", "Download complete.");
                    call.resolve(ret);
                } else {
                    ret.put("status", "NOT_FOUND");
                    ret.put("message", "Download task not found in system");
                    call.resolve(ret);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking download status", e);
            call.reject("Failed to query download status: " + e.getMessage(), e);
        }
    }

    /**
     * Verify APK integrity: package name, version, and SHA-256 checksum
     */
    @PluginMethod
    public void verifyApk(PluginCall call) {
        String filePath = call.getString("filePath");
        String fileName = call.getString("fileName", DEFAULT_APK_NAME);
        String expectedSha256 = call.getString("expectedSha256");

        try {
            Context context = getContext();
            File file;
            if (filePath != null && !filePath.isEmpty()) {
                file = new File(filePath);
            } else {
                file = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName);
            }

            JSObject ret = new JSObject();
            ret.put("filePath", file.getAbsolutePath());
            ret.put("exists", file.exists());
            ret.put("fileSize", file.length());

            if (!file.exists() || file.length() == 0) {
                ret.put("valid", false);
                ret.put("error", "APK file does not exist or has 0 bytes");
                call.resolve(ret);
                return;
            }

            // Verify package structure via Android PackageManager
            PackageManager pm = context.getPackageManager();
            PackageInfo pi = pm.getPackageArchiveInfo(file.getAbsolutePath(), 0);
            if (pi == null) {
                ret.put("valid", false);
                ret.put("error", "Corrupt APK: Android PackageManager could not parse package archive");
                call.resolve(ret);
                return;
            }

            ret.put("packageName", pi.packageName);
            ret.put("versionName", pi.versionName);
            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = pi.getLongVersionCode();
            } else {
                versionCode = pi.versionCode;
            }
            ret.put("versionCode", versionCode);

            // Compute SHA-256
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (FileInputStream fis = new FileInputStream(file)) {
                byte[] buffer = new byte[16384];
                int read;
                while ((read = fis.read(buffer)) != -1) {
                    digest.update(buffer, 0, read);
                }
            }
            byte[] hash = digest.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            String actualSha256 = sb.toString();
            ret.put("sha256", actualSha256);

            boolean matchesExpected = true;
            if (expectedSha256 != null && !expectedSha256.trim().isEmpty()) {
                matchesExpected = actualSha256.equalsIgnoreCase(expectedSha256.trim());
            }
            ret.put("matchesExpectedSha256", matchesExpected);
            ret.put("valid", true);

            Log.i(TAG, "APK Verified: pkg=" + pi.packageName + " ver=" + pi.versionName + " code=" + versionCode + " sha256=" + actualSha256);

            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error verifying APK", e);
            call.reject("Error verifying APK: " + e.getMessage(), e);
        }
    }

    /**
     * Launch Android Package Installer using FileProvider content:// URI
     */
    @PluginMethod
    public void installApk(PluginCall call) {
        String filePath = call.getString("filePath");
        String fileName = call.getString("fileName", DEFAULT_APK_NAME);

        try {
            Context context = getContext();
            File apkFile;
            if (filePath != null && !filePath.isEmpty()) {
                apkFile = new File(filePath);
            } else {
                apkFile = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName);
            }

            if (!apkFile.exists() || apkFile.length() == 0) {
                call.reject("APK file does not exist or is empty at: " + apkFile.getAbsolutePath());
                return;
            }

            // Verify REQUEST_INSTALL_PACKAGES if on Android 8+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                boolean canInstall = context.getPackageManager().canRequestPackageInstalls();
                if (!canInstall) {
                    JSObject ret = new JSObject();
                    ret.put("success", false);
                    ret.put("requiresPermission", true);
                    ret.put("message", "Allow IKSHOVIA to install updates from this source.");
                    call.resolve(ret);
                    return;
                }
            }

            Uri apkUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
            );

            Log.i(TAG, "Opening Android Package Installer with URI: " + apkUri);

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            context.startActivity(installIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("contentUri", apkUri.toString());
            ret.put("message", "Android package installer launched successfully.");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch package installer", e);
            call.reject("Failed to launch package installer: " + e.getMessage(), e);
        }
    }

    /**
     * Direct streaming download fallback (in case DownloadManager is blocked/disabled)
     */
    @PluginMethod
    public void downloadDirectly(PluginCall call) {
        String urlString = call.getString("url", DEFAULT_URL);
        String fileName = call.getString("fileName", DEFAULT_APK_NAME);

        // Run on background thread
        new Thread(() -> {
            try {
                Context context = getContext();
                File targetDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (targetDir != null && !targetDir.exists()) {
                    targetDir.mkdirs();
                }
                File targetFile = new File(targetDir, fileName);
                if (targetFile.exists()) {
                    targetFile.delete();
                }

                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.setRequestProperty("User-Agent", "IKSHOVIA-Android-Client");
                conn.connect();

                int responseCode = conn.getResponseCode();
                if (responseCode != HttpURLConnection.HTTP_OK) {
                    call.reject("Server returned HTTP " + responseCode);
                    return;
                }

                long totalBytes = conn.getContentLength();
                InputStream in = conn.getInputStream();
                FileOutputStream out = new FileOutputStream(targetFile);

                byte[] buffer = new byte[16384];
                long downloaded = 0;
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                    downloaded += read;
                }
                out.flush();
                out.close();
                in.close();
                conn.disconnect();

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("filePath", targetFile.getAbsolutePath());
                ret.put("bytesDownloaded", downloaded);
                ret.put("totalBytes", totalBytes > 0 ? totalBytes : downloaded);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "Direct download failed", e);
                call.reject("Direct download error: " + e.getMessage(), e);
            }
        }).start();
    }

    private String getPausedReasonText(int reason) {
        switch (reason) {
            case DownloadManager.PAUSED_WAITING_FOR_NETWORK:
                return "Waiting for network connectivity";
            case DownloadManager.PAUSED_QUEUED_FOR_WIFI:
                return "Queued for Wi-Fi";
            case DownloadManager.PAUSED_WAITING_TO_RETRY:
                return "Waiting to retry";
            default:
                return "Paused (code " + reason + ")";
        }
    }

    private String getFailedReasonText(int reason) {
        switch (reason) {
            case DownloadManager.ERROR_CANNOT_RESUME:
                return "Cannot resume download";
            case DownloadManager.ERROR_DEVICE_NOT_FOUND:
                return "Storage device not found";
            case DownloadManager.ERROR_FILE_ALREADY_EXISTS:
                return "Destination file already exists";
            case DownloadManager.ERROR_FILE_ERROR:
                return "Storage file write error";
            case DownloadManager.ERROR_HTTP_DATA_ERROR:
                return "HTTP protocol data error";
            case DownloadManager.ERROR_INSUFFICIENT_SPACE:
                return "Insufficient device storage";
            case DownloadManager.ERROR_TOO_MANY_REDIRECTS:
                return "Too many redirects";
            case DownloadManager.ERROR_UNHANDLED_HTTP_CODE:
                return "Unhandled HTTP status code";
            default:
                return "System error (code " + reason + ")";
        }
    }
}
