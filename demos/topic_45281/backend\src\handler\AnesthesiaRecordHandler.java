package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.AnesthesiaRecord;
import service.AnesthesiaRecordService;
import java.util.List;
import java.util.Map;

public class AnesthesiaRecordHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                AnesthesiaRecordService service = new AnesthesiaRecordService();

                if ("/api/anesthesia-records".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<AnesthesiaRecord> list;
                    if (query != null && query.contains("surgeryId=")) {
                        int surgeryId = Integer.parseInt(query.substring(query.indexOf("surgeryId=") + 10));
                        list = service.getBySurgeryId(surgeryId);
                    } else {
                        list = service.getAll();
                    }
                    sendResponse(exchange, "{\"items\":" + toJson(list) + ",\"count\":" + list.size() + "}");
                } else if ("/api/anesthesia-records".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    AnesthesiaRecord record = new AnesthesiaRecord();
                    record.setSurgeryId(getIntParam(params, "surgeryId"));
                    record.setPatientId(getIntParam(params, "patientId"));
                    record.setPatientName(params.get("patientName") != null ? params.get("patientName") : "");
                    record.setAnesthesiaMethod(params.get("anesthesiaMethod") != null ? params.get("anesthesiaMethod") : "");
                    record.setInductionDrugs(params.get("inductionDrugs") != null ? params.get("inductionDrugs") : "");
                    record.setVitalSignsMonitor(params.get("vitalSignsMonitor") != null ? params.get("vitalSignsMonitor") : "");
                    record.setBloodLossMl(getIntParam(params, "bloodLossMl"));
                    record.setAnesthesiologistId(getIntParam(params, "anesthesiologistId"));
                    record.setAnesthesiologistName(params.get("anesthesiologistName") != null ? params.get("anesthesiologistName") : "");
                    int result = service.add(record);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/anesthesia-records/\\d+") && "PUT".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    AnesthesiaRecord record = service.getById(id);
                    if (record == null) {
                        sendError(exchange, 404, "AnesthesiaRecord not found");
                        return;
                    }
                    if (params.get("anesthesiaMethod") != null) record.setAnesthesiaMethod(params.get("anesthesiaMethod"));
                    if (params.get("inductionDrugs") != null) record.setInductionDrugs(params.get("inductionDrugs"));
                    if (params.get("vitalSignsMonitor") != null) record.setVitalSignsMonitor(params.get("vitalSignsMonitor"));
                    if (params.get("bloodLossMl") != null) record.setBloodLossMl(getIntParam(params, "bloodLossMl"));
                    if (params.get("anesthesiologistId") != null && !params.get("anesthesiologistId").isEmpty()) record.setAnesthesiologistId(getIntParam(params, "anesthesiologistId"));
                    if (params.get("anesthesiologistName") != null) record.setAnesthesiologistName(params.get("anesthesiologistName"));
                    int result = service.update(record);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/anesthesia-records/\\d+") && "GET".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    AnesthesiaRecord record = service.getById(id);
                    if (record == null) {
                        sendError(exchange, 404, "AnesthesiaRecord not found");
                        return;
                    }
                    sendResponse(exchange, toJson(record));
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
