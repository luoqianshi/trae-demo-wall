package handler;

import bean.FileAsset;
import com.sun.net.httpserver.HttpExchange;
import service.AuditLogService;
import service.FileAssetService;
import util.ApiResponse;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FileHandler extends BaseHandler {
    private final FileAssetService service = new FileAssetService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleCors(exchange)) return;
        try {
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();

            if ("/api/files/upload".equals(path) && "POST".equals(method)) {
                handleUpload(exchange);
            } else if (path.matches("/api/files/[A-Za-z0-9]+") && "GET".equals(method)) {
                String uuid = path.substring("/api/files/".length());
                handleDownload(exchange, uuid);
            } else if (path.matches("/api/files/[A-Za-z0-9]+") && "DELETE".equals(method)) {
                String uuid = path.substring("/api/files/".length());
                int rows = service.markDeleted(uuid);
                new AuditLogService().record(
                    "file_delete",
                    "file_asset",
                    null,
                    null,
                    "文件服务",
                    null,
                    String.valueOf(exchange.getRemoteAddress()),
                    rows > 0,
                    "删除文件: " + uuid
                );
                sendResponse(exchange, ApiResponse.successBuilder().put("deleted", rows > 0).build());
            } else if ("/api/files".equals(path) && "GET".equals(method)) {
                Map<String, String> query = parseQuery(exchange.getRequestURI().getQuery());
                String ownerType = query.get("ownerType");
                Long ownerId = parseLong(query.get("ownerId"));
                List<FileAsset> list = service.getByOwner(ownerType, ownerId);
                sendResponse(exchange, ApiResponse.successBuilder().put("files", list).count(list.size()).build());
            } else {
                sendError(exchange, 404, "Not Found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendError(exchange, 500, e.getMessage());
        } finally {
            exchange.close();
        }
    }

    private void handleUpload(HttpExchange exchange) throws Exception {
        String contentType = exchange.getRequestHeaders().getFirst("Content-Type");
        if (contentType == null || !contentType.toLowerCase().contains("multipart/form-data")) {
            sendError(exchange, 400, "请使用 multipart/form-data 上传文件");
            return;
        }
        MultipartData data = parseMultipart(exchange, contentType);
        if (data.fileBytes == null) {
            sendError(exchange, 400, "缺少文件字段 file");
            return;
        }

        Long ownerId = parseLong(data.fields.get("ownerId"));
        Long uploadedBy = parseLong(data.fields.get("uploadedBy"));
        FileAsset file = service.save(
            data.fileName,
            data.fileContentType,
            data.fileBytes,
            data.fields.get("category"),
            data.fields.get("ownerType"),
            ownerId,
            uploadedBy
        );
        new AuditLogService().record(
            "file_upload",
            "file_asset",
            file.getId(),
            "patient".equals(file.getOwnerType()) ? file.getOwnerId() : null,
            "文件服务",
            data.fields.get("operator"),
            String.valueOf(exchange.getRemoteAddress()),
            true,
            "上传文件: " + file.getOriginalName()
        );
        sendResponse(exchange, ApiResponse.successBuilder().put("file", file).put("url", "/api/files/" + file.getFileUuid()).build());
    }

    private void handleDownload(HttpExchange exchange, String uuid) throws IOException {
        FileAsset file = service.getByUuid(uuid);
        if (file == null) {
            sendError(exchange, 404, "文件不存在");
            return;
        }
        byte[] bytes = service.readFile(file);
        service.logAccess(uuid, "download", exchange.getRequestHeaders().getFirst("Authorization"), String.valueOf(exchange.getRemoteAddress()));
        new AuditLogService().record(
            "file_download",
            "file_asset",
            file.getId(),
            "patient".equals(file.getOwnerType()) ? file.getOwnerId() : null,
            "文件服务",
            exchange.getRequestHeaders().getFirst("Authorization"),
            String.valueOf(exchange.getRemoteAddress()),
            true,
            "读取文件: " + file.getOriginalName()
        );

        exchange.getResponseHeaders().set("Content-Type", file.getMimeType());
        exchange.getResponseHeaders().set("Content-Disposition", "inline; filename=\"" + encodeHeaderFileName(file.getOriginalName()) + "\"");
        exchange.getResponseHeaders().set("Cache-Control", "private, max-age=3600");
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private MultipartData parseMultipart(HttpExchange exchange, String contentType) throws IOException {
        String boundary = extractBoundary(contentType);
        if (boundary == null || boundary.isEmpty()) throw new IOException("缺少 multipart boundary");
        byte[] body = FileAssetService.readAll(exchange.getRequestBody());
        String raw = new String(body, StandardCharsets.ISO_8859_1);
        String separator = "--" + boundary;
        MultipartData result = new MultipartData();

        for (String part : raw.split(java.util.regex.Pattern.quote(separator))) {
            if (part == null || part.isEmpty() || part.equals("--") || part.equals("--\r\n")) continue;
            if (part.startsWith("\r\n")) part = part.substring(2);
            int headerEnd = part.indexOf("\r\n\r\n");
            if (headerEnd < 0) continue;
            String headers = part.substring(0, headerEnd);
            String content = part.substring(headerEnd + 4);
            if (content.endsWith("\r\n")) content = content.substring(0, content.length() - 2);
            if (content.endsWith("--")) content = content.substring(0, content.length() - 2);

            String disposition = findHeader(headers, "Content-Disposition");
            if (disposition == null) continue;
            String name = extractDispositionValue(disposition, "name");
            String fileName = extractDispositionValue(disposition, "filename");
            if (name == null) continue;

            if (fileName != null) {
                result.fileName = decodePartHeader(fileName);
                result.fileContentType = findHeader(headers, "Content-Type");
                result.fileBytes = content.getBytes(StandardCharsets.ISO_8859_1);
            } else {
                result.fields.put(name, content);
            }
        }
        return result;
    }

    private String extractBoundary(String contentType) {
        for (String token : contentType.split(";")) {
            String t = token.trim();
            if (t.startsWith("boundary=")) {
                String value = t.substring("boundary=".length());
                if (value.startsWith("\"") && value.endsWith("\"")) return value.substring(1, value.length() - 1);
                return value;
            }
        }
        return null;
    }

    private String findHeader(String headers, String name) {
        for (String line : headers.split("\r\n")) {
            int idx = line.indexOf(':');
            if (idx > 0 && line.substring(0, idx).trim().equalsIgnoreCase(name)) {
                return line.substring(idx + 1).trim();
            }
        }
        return null;
    }

    private String extractDispositionValue(String disposition, String key) {
        for (String token : disposition.split(";")) {
            String t = token.trim();
            String prefix = key + "=";
            if (t.startsWith(prefix)) {
                String value = t.substring(prefix.length());
                if (value.startsWith("\"") && value.endsWith("\"")) return value.substring(1, value.length() - 1);
                return value;
            }
        }
        return null;
    }

    private Long parseLong(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try { return Long.parseLong(value.trim()); } catch (Exception e) { return null; }
    }

    private String decodePartHeader(String value) {
        try { return URLDecoder.decode(value, "UTF-8"); } catch (Exception e) { return value; }
    }

    private String encodeHeaderFileName(String value) {
        return value == null ? "file" : value.replace("\"", "'");
    }

    private static class MultipartData {
        Map<String, String> fields = new HashMap<>();
        String fileName;
        String fileContentType;
        byte[] fileBytes;
    }
}
