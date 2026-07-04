package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.MedicalRecordVersion;
import service.MedicalRecordVersionService;
import java.util.List;
import java.util.Map;

public class MedicalRecordVersionHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/medical-record-versions".equals(path) && "GET".equals(method)) {
                    List<MedicalRecordVersion> versions = new MedicalRecordVersionService().getAllMedicalRecordVersions();
                    sendResponse(exchange, "{\"versions\":" + toJson(versions) + ",\"count\":" + versions.size() + "}");
                } else if (path.matches("/api/medical-record-versions/record/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int recordId = Integer.parseInt(idStr);
                    List<MedicalRecordVersion> versions = new MedicalRecordVersionService().getMedicalRecordVersionsByRecordId(recordId);
                    sendResponse(exchange, "{\"versions\":" + toJson(versions) + ",\"count\":" + versions.size() + "}");
                } else if ("/api/medical-record-versions".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    MedicalRecordVersion version = new MedicalRecordVersion();
                    if (params.get("recordId") != null && !params.get("recordId").isEmpty()) {
                        version.setRecordId(Integer.parseInt(params.get("recordId")));
                    }
                    if (params.get("content") != null) version.setContent(params.get("content"));
                    if (params.get("operatorId") != null && !params.get("operatorId").isEmpty()) {
                        version.setOperatorId(Integer.parseInt(params.get("operatorId")));
                    }
                    int result = new MedicalRecordVersionService().addMedicalRecordVersion(version);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
