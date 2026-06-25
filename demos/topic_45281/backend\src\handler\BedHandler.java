package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Bed;
import service.BedService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class BedHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                BedService service = new BedService();

                if ("/api/beds".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<Bed> list;
                    if (query != null && query.contains("dept=")) {
                        String dept = query.substring(query.indexOf("dept=") + 5);
                        int endIdx = dept.indexOf("&");
                        if (endIdx > 0) dept = dept.substring(0, endIdx);
                        list = service.getByDept(java.net.URLDecoder.decode(dept, "UTF-8"));
                    } else if (query != null && query.contains("status=")) {
                        String status = query.substring(query.indexOf("status=") + 7);
                        int endIdx = status.indexOf("&");
                        if (endIdx > 0) status = status.substring(0, endIdx);
                        list = service.getByStatus(java.net.URLDecoder.decode(status, "UTF-8"));
                    } else {
                        list = service.getAll();
                    }
                    int page = 1, size = 20;
                    if (query != null) {
                        if (query.contains("page=")) {
                            String p = query.substring(query.indexOf("page=") + 5);
                            int endIdx = p.indexOf("&");
                            if (endIdx > 0) p = p.substring(0, endIdx);
                            page = Math.max(1, Integer.parseInt(p));
                        }
                        if (query.contains("size=")) {
                            String s = query.substring(query.indexOf("size=") + 5);
                            int endIdx = s.indexOf("&");
                            if (endIdx > 0) s = s.substring(0, endIdx);
                            size = Math.max(1, Math.min(999999, Integer.parseInt(s)));
                        }
                    }
                    int total = list.size();
                    int fromIndex = (page - 1) * size;
                    int toIndex = Math.min(fromIndex + size, total);
                    List<Bed> pageList = fromIndex < total ? list.subList(fromIndex, toIndex) : new java.util.ArrayList<Bed>();
                    sendResponse(exchange, "{\"items\":" + toJsonBedList(pageList) + ",\"total\":" + total + ",\"page\":" + page + ",\"size\":" + size + ",\"pages\":" + ((total + size - 1) / size) + "}");
                } else if ("/api/beds/clear".equals(path) && "POST".equals(method)) {
                    int result = service.deleteAll();
                    sendResponse(exchange, "{\"success\":true,\"deleted\":" + result + "}");
                } else if ("/api/beds".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Bed bed = new Bed();
                    bed.setBedNo(params.get("bedNo") != null ? params.get("bedNo") : "");
                    bed.setDept(params.get("dept") != null ? params.get("dept") : "");
                    bed.setStatus(params.get("status") != null ? params.get("status") : "vacant");
                    bed.setType(params.get("type") != null ? params.get("type") : "normal");
                    String patientIdStr = params.get("patientId") != null ? params.get("patientId") : params.get("currentPatientId");
                    if (patientIdStr != null && !patientIdStr.isEmpty()) bed.setCurrentPatientId(Integer.parseInt(patientIdStr));
                    String patientName = params.get("patientName") != null ? params.get("patientName") : params.get("currentPatientName");
                    if (patientName != null) bed.setCurrentPatientName(patientName);
                    int result = service.add(bed);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/beds/\\d+") && "PUT".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Bed bed = service.getById(id);
                    if (bed == null) {
                        sendError(exchange, 404, "Bed not found");
                        return;
                    }
                    if (params.get("bedNo") != null) bed.setBedNo(params.get("bedNo"));
                    if (params.get("dept") != null) bed.setDept(params.get("dept"));
                    if (params.get("status") != null) bed.setStatus(params.get("status"));
                    if (params.get("type") != null) bed.setType(params.get("type"));
                    String patientIdStr = params.get("patientId") != null ? params.get("patientId") : params.get("currentPatientId");
                    if (patientIdStr != null && !patientIdStr.isEmpty()) bed.setCurrentPatientId(Integer.parseInt(patientIdStr));
                    String patientName = params.get("patientName") != null ? params.get("patientName") : params.get("currentPatientName");
                    if (patientName != null) bed.setCurrentPatientName(patientName);
                    int result = service.update(bed);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/beds/allocate/\\d+") && "POST".equals(method)) {
                    int bedId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    int patientId = getIntParam(params, "patientId");
                    String patientName = params.get("patientName") != null ? params.get("patientName") : "";
                    int result = service.allocate(bedId, patientId, patientName);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/beds/vacate/\\d+") && "POST".equals(method)) {
                    int bedId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    int result = service.vacate(bedId);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/beds/\\d+") && "GET".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    Bed bed = service.getById(id);
                    if (bed == null) {
                        sendError(exchange, 404, "Bed not found");
                        return;
                    }
                    sendResponse(exchange, toJson(bed));
                } else if ("/api/beds".equals(path) && "DELETE".equals(method)) {
                    int result = service.deleteAll();
                    sendResponse(exchange, "{\"success\":true,\"deleted\":" + result + "}");
                } else if (path.matches("/api/beds/\\d+") && "DELETE".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    int result = service.deleteById(id);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }

    private String toJsonBedList(List<Bed> list) {
        if (list == null || list.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            Bed b = list.get(i);
            sb.append("{");
            sb.append("\"id\":").append(b.getId()).append(",");
            sb.append("\"bedNo\":").append(b.getBedNo() != null ? "\"" + escapeJson(b.getBedNo()) + "\"" : "null").append(",");
            sb.append("\"dept\":").append(b.getDept() != null ? "\"" + escapeJson(b.getDept()) + "\"" : "null").append(",");
            sb.append("\"status\":").append(b.getStatus() != null ? "\"" + escapeJson(b.getStatus()) + "\"" : "null").append(",");
            sb.append("\"type\":").append(b.getType() != null ? "\"" + escapeJson(b.getType()) + "\"" : "null").append(",");
            sb.append("\"patientId\":").append(b.getCurrentPatientId()).append(",");
            sb.append("\"patientName\":").append(b.getCurrentPatientName() != null ? "\"" + escapeJson(b.getCurrentPatientName()) + "\"" : "null");
            sb.append("}");
        }
        sb.append("]");
        return sb.toString();
    }
}
