package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.PhysicalExam;
import service.PhysicalExamService;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public class PhysicalExamHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                PhysicalExamService service = new PhysicalExamService();

                if ("/api/physical-exams".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<PhysicalExam> list;
                    if (query != null && query.contains("patientId=")) {
                        int patientId = Integer.parseInt(query.substring(query.indexOf("patientId=") + 10).split("&")[0]);
                        list = service.getByPatientId(patientId);
                    } else if (query != null && query.contains("status=")) {
                        String status = query.substring(query.indexOf("status=") + 7);
                        list = service.getByStatus(java.net.URLDecoder.decode(status, "UTF-8"));
                    } else {
                        list = service.getAll();
                    }
                    sendResponse(exchange, "{\"items\":" + toJson(list) + ",\"count\":" + list.size() + "}");
                } else if ("/api/physical-exams".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    PhysicalExam exam = new PhysicalExam();
                    exam.setPatientId(getIntParam(params, "patientId"));
                    exam.setPatientName(params.get("patientName") != null ? params.get("patientName") : "");
                    exam.setExamDate(params.get("examDate") != null ? params.get("examDate") : "");
                    exam.setStatus(params.get("status") != null ? params.get("status") : "pending");
                    exam.setConclusion(params.get("conclusion") != null ? params.get("conclusion") : "");
                    exam.setExaminer(params.get("examiner") != null ? params.get("examiner") : "");
                    exam.setItems(params.get("items") != null ? params.get("items") : "");
                    exam.setRemark(params.get("remark") != null ? params.get("remark") : "");
                    if (params.get("totalFee") != null && !params.get("totalFee").isEmpty()) {
                        exam.setTotalFee(new java.math.BigDecimal(params.get("totalFee")));
                    }
                    int result = service.add(exam);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/physical-exams/\\d+") && "PUT".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    PhysicalExam exam = service.getById(id);
                    if (exam == null) {
                        sendError(exchange, 404, "PhysicalExam not found");
                        return;
                    }
                    if (params.get("status") != null) exam.setStatus(params.get("status"));
                    if (params.get("conclusion") != null) exam.setConclusion(params.get("conclusion"));
                    if (params.get("examiner") != null) exam.setExaminer(params.get("examiner"));
                    if (params.get("items") != null) exam.setItems(params.get("items"));
                    if (params.get("remark") != null) exam.setRemark(params.get("remark"));
                    if (params.get("totalFee") != null && !params.get("totalFee").isEmpty()) {
                        exam.setTotalFee(new java.math.BigDecimal(params.get("totalFee")));
                    }
                    int result = service.update(exam);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/physical-exams/\\d+") && "GET".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    PhysicalExam exam = service.getById(id);
                    if (exam == null) {
                        sendError(exchange, 404, "PhysicalExam not found");
                        return;
                    }
                    sendResponse(exchange, toJson(exam));
                } else if (path.matches("/api/physical-exams/complete/\\d+") && "POST".equals(method)) {
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile("/api/physical-exams/complete/(\\d+)");
                    java.util.regex.Matcher m = p.matcher(path);
                    if (m.find()) {
                        int id = Integer.parseInt(m.group(1));
                        String body = getRequestBody(exchange);
                        Map<String, String> params = parseJson(body);
                        PhysicalExam exam = service.getById(id);
                        if (exam == null) {
                            sendError(exchange, 404, "PhysicalExam not found");
                            return;
                        }
                        if (params.get("conclusion") != null) exam.setConclusion(params.get("conclusion"));
                        exam.setStatus("completed");
                        int result = service.update(exam);
                        sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                    } else {
                        sendError(exchange, 400, "Invalid path");
                    }
                } else if (path.matches("/api/physical-exams/\\d+") && "DELETE".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    int result = service.delete(id);
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
