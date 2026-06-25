package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Drug;
import bean.InventoryLog;
import service.InventoryLogService;
import java.util.List;
import java.util.Map;

public class InventoryLogHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/inventory-logs".equals(path) && "GET".equals(method)) {
                    List<InventoryLog> logs = new InventoryLogService().getAllInventoryLogs();
                    sendResponse(exchange, "{\"inventoryLogs\":" + toJson(logs) + ",\"count\":" + logs.size() + "}");
                } else if (path.matches("/api/inventory-logs/drug/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int drugId = Integer.parseInt(idStr);
                    List<InventoryLog> logs = new InventoryLogService().getInventoryLogsByDrugId(drugId);
                    sendResponse(exchange, "{\"inventoryLogs\":" + toJson(logs) + ",\"count\":" + logs.size() + "}");
                } else if ("/api/inventory-logs".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    InventoryLog log = new InventoryLog();
                    if (params.get("drugId") != null && !params.get("drugId").isEmpty()) {
                        log.setDrugId(Integer.parseInt(params.get("drugId")));
                    }
                    if (params.get("type") != null) log.setChangeType(params.get("type"));
                    if (params.get("num") != null && !params.get("num").isEmpty()) {
                        log.setChangeNum(Integer.parseInt(params.get("num")));
                    }
                    if (params.get("operator") != null) log.setOperator(params.get("operator"));
                    if (params.get("remark") != null) log.setReason(params.get("remark"));
                    int result = new InventoryLogService().addInventoryLog(log);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
