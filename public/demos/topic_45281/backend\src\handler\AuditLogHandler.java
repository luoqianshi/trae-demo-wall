package handler;

import bean.AuditLog;
import com.sun.net.httpserver.HttpExchange;
import service.AuditLogService;
import util.ApiResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class AuditLogHandler extends BaseHandler {
    private final AuditLogService service = new AuditLogService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleCors(exchange)) return;
        try {
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();

            if ("/api/audit-logs".equals(path) && "GET".equals(method)) {
                Map<String, String> query = parseQuery(exchange.getRequestURI().getQuery());
                int offset = parseInt(query.get("offset"), 0);
                int limit = parseInt(query.get("limit"), 50);
                List<AuditLog> logs = service.find(query, offset, limit);
                int total = service.count(query);
                sendResponse(exchange, ApiResponse.successBuilder()
                    .put("logs", logs)
                    .put("total", total)
                    .put("offset", offset)
                    .put("limit", limit)
                    .build());
            } else if ("/api/audit-logs".equals(path) && "POST".equals(method)) {
                AuditLog log = gson.fromJson(getRequestBody(exchange), AuditLog.class);
                if (log.getRequestIp() == null) log.setRequestIp(String.valueOf(exchange.getRemoteAddress()));
                int id = service.record(log);
                sendResponse(exchange, ApiResponse.successBuilder().put("id", id).build());
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

    private int parseInt(String value, int defaultValue) {
        if (value == null || value.trim().isEmpty()) return defaultValue;
        try { return Integer.parseInt(value.trim()); } catch (Exception e) { return defaultValue; }
    }
}
