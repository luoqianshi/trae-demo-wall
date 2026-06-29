package service;

import bean.FileAsset;
import dao.impl.FileAssetDAOImpl;
import util.JDBCUtil;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class FileAssetService {
    private static final long MAX_FILE_SIZE = 20L * 1024L * 1024L;
    private static final Set<String> ALLOWED_MIME_TYPES = new HashSet<>(Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf",
        "text/plain", "application/octet-stream"
    ));

    private final FileAssetDAOImpl dao = new FileAssetDAOImpl();

    public FileAssetService() {
        ensureTables();
    }

    public FileAsset save(
        String originalName,
        String mimeType,
        byte[] bytes,
        String category,
        String ownerType,
        Long ownerId,
        Long uploadedBy
    ) throws Exception {
        if (bytes == null || bytes.length == 0) throw new IllegalArgumentException("上传文件不能为空");
        if (bytes.length > MAX_FILE_SIZE) throw new IllegalArgumentException("文件大小不能超过 20MB");
        String safeMime = mimeType == null || mimeType.isEmpty() ? "application/octet-stream" : mimeType.toLowerCase();
        if (!ALLOWED_MIME_TYPES.contains(safeMime)) throw new IllegalArgumentException("不支持的文件类型: " + safeMime);

        String safeName = sanitizeFileName(originalName == null || originalName.isEmpty() ? "upload.bin" : originalName);
        String ext = extensionOf(safeName);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        LocalDate now = LocalDate.now();
        Path root = getUploadRoot();
        Path dir = root.resolve(Paths.get(String.valueOf(now.getYear()), String.format("%02d", now.getMonthValue()), String.format("%02d", now.getDayOfMonth())));
        Files.createDirectories(dir);
        Path stored = dir.resolve(uuid + ext).normalize();
        if (!stored.startsWith(root.normalize())) throw new IOException("非法存储路径");
        Files.write(stored, bytes);

        FileAsset file = new FileAsset();
        file.setFileUuid(uuid);
        file.setOriginalName(safeName);
        file.setStoragePath(root.relativize(stored).toString().replace('\\', '/'));
        file.setMimeType(safeMime);
        file.setFileSize(bytes.length);
        file.setFileSha256(sha256(bytes));
        file.setCategory(category == null || category.isEmpty() ? "clinical_attachment" : category);
        file.setOwnerType(ownerType);
        file.setOwnerId(ownerId);
        file.setUploadedBy(uploadedBy);
        int id = dao.insert(file);
        file.setId(id);
        return file;
    }

    public FileAsset getByUuid(String fileUuid) {
        return dao.findByUuid(fileUuid);
    }

    public List<FileAsset> getByOwner(String ownerType, Long ownerId) {
        return dao.findByOwner(ownerType, ownerId);
    }

    public byte[] readFile(FileAsset file) throws IOException {
        Path root = getUploadRoot().normalize();
        Path target = root.resolve(file.getStoragePath()).normalize();
        if (!target.startsWith(root)) throw new IOException("非法文件路径");
        return Files.readAllBytes(target);
    }

    public int markDeleted(String fileUuid) {
        return dao.markDeleted(fileUuid);
    }

    public void logAccess(String fileUuid, String action, String operator, String remoteAddress) {
        JDBCUtil.executeUpdate(
            "INSERT INTO file_access_log(file_uuid,action,operator,remote_address) VALUES(?,?,?,?)",
            fileUuid, action, operator, remoteAddress
        );
    }

    public static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int n;
        while ((n = in.read(buffer)) >= 0) {
            out.write(buffer, 0, n);
        }
        return out.toByteArray();
    }

    private void ensureTables() {
        JDBCUtil.executeUpdate(
            "CREATE TABLE IF NOT EXISTS file_asset (" +
            "id BIGINT PRIMARY KEY AUTO_INCREMENT," +
            "file_uuid VARCHAR(64) NOT NULL UNIQUE," +
            "original_name VARCHAR(255) NOT NULL," +
            "storage_path VARCHAR(500) NOT NULL," +
            "mime_type VARCHAR(100) NOT NULL," +
            "file_size BIGINT NOT NULL," +
            "file_sha256 VARCHAR(128)," +
            "category VARCHAR(50) NOT NULL," +
            "owner_type VARCHAR(50)," +
            "owner_id BIGINT," +
            "uploaded_by BIGINT," +
            "uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
            "deleted TINYINT DEFAULT 0," +
            "INDEX idx_file_owner (owner_type, owner_id)," +
            "INDEX idx_file_category (category)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        JDBCUtil.executeUpdate(
            "CREATE TABLE IF NOT EXISTS file_access_log (" +
            "id BIGINT PRIMARY KEY AUTO_INCREMENT," +
            "file_uuid VARCHAR(64) NOT NULL," +
            "action VARCHAR(30) NOT NULL," +
            "operator VARCHAR(100)," +
            "remote_address VARCHAR(100)," +
            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
            "INDEX idx_file_access_uuid (file_uuid)," +
            "INDEX idx_file_access_time (created_at)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    private static Path getUploadRoot() {
        return Paths.get("uploads").toAbsolutePath().normalize();
    }

    private static String sanitizeFileName(String name) {
        return name.replaceAll("[\\\\/:*?\"<>|\\r\\n]+", "_").trim();
    }

    private static String extensionOf(String name) {
        int index = name.lastIndexOf('.');
        if (index < 0 || index == name.length() - 1) return "";
        String ext = name.substring(index).toLowerCase();
        if (ext.length() > 12) return "";
        return ext;
    }

    private static String sha256(byte[] bytes) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
