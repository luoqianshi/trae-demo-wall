package handler;

import bean.ClinicalAttachment;
import com.sun.net.httpserver.HttpExchange;
import service.AuditLogService;
import service.ClinicalAttachmentService;
import service.FileAssetService;
import util.ApiResponse;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ClinicalAttachmentHandler extends BaseHandler {
    private final ClinicalAttachmentService service = new ClinicalAttachmentService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleCors(exchange)) return;
        try {
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();

            if ("/api/clinical-attachments".equals(path) && "GET".equals(method)) {
                Map<String, String> query = parseQuery(exchange.getRequestURI().getQuery());
                Long patientId = parseLong(query.get("patientId"));
                if (patientId == null) {
                    sendError(exchange, 400, "patientId 为必填参数");
                    return;
                }
                List<ClinicalAttachment> list = service.findByPatient(
                    patientId,
                    parseLong(query.get("visitId")),
                    parseLong(query.get("recordId")),
                    query.get("attachmentType")
                );
                sendResponse(exchange, ApiResponse.successBuilder().put("attachments", list).count(list.size()).build());
            } else if ("/api/clinical-attachments".equals(path) && "POST".equals(method)) {
                handleCreate(exchange);
            } else if (path.matches("/api/clinical-attachments/\\d+") && "DELETE".equals(method)) {
                long id = Long.parseLong(path.substring(path.lastIndexOf('/') + 1));
                int rows = service.delete(id);
                new AuditLogService().record(
                    "attachment_delete",
                    "clinical_attachment",
                    id,
                    null,
                    "临床附件",
                    null,
                    String.valueOf(exchange.getRemoteAddress()),
                    rows > 0,
                    "删除临床附件关联: " + id
                );
                sendResponse(exchange, ApiResponse.successBuilder().put("deleted", rows > 0).build());
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

    private void handleCreate(HttpExchange exchange) throws Exception {
        String contentType = exchange.getRequestHeaders().getFirst("Content-Type");
        if (contentType == null || !contentType.toLowerCase().contains("multipart/form-data")) {
            sendError(exchange, 400, "请使用 multipart/form-data 上传附件");
            return;
        }
        MultipartData data = parseMultipart(exchange, contentType);
        Long patientId = parseLong(data.fields.get("patientId"));
        if (patientId == null) {
            sendError(exchange, 400, "patientId 为必填参数");
            return;
        }
        if (data.fileBytes == null) {
            sendError(exchange, 400, "缺少文件字段 file");
            return;
        }

        ClinicalAttachment attachment = service.create(
            patientId,
            parseLong(data.fields.get("visitId")),
            parseLong(data.fields.get("recordId")),
            data.fields.get("attachmentType"),
            data.fields.get("remark"),
            data.fileName,
            data.fileContentType,
            data.fileBytes,
            parseLong(data.fields.get("uploadedBy"))
        );
        new AuditLogService().record(
            "attachment_upload",
            "clinical_attachment",
            attachment.getId(),
            attachment.getPatientId(),
            "临床附件",
            data.fields.get("operator"),
            String.valueOf(exchange.getRemoteAddress()),
            true,
            "上传附件: " + data.fileName + " / " + attachment.getAttachmentType()
        );
        sendResponse(exchange, ApiResponse.successBuilder().put("attachment", attachment).build());
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

    private static class MultipartData {
        Map<String, String> fields = new HashMap<>();
        String fileName;
        String fileContentType;
        byte[] fileBytes;
    }
}
