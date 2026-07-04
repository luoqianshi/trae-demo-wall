package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Examination;
import service.ExaminationService;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public class ExaminationHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/examinations".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<Examination> examinations;
                    if (query != null && query.contains("category=")) {
                        String category = query.substring(query.indexOf("category=") + 9);
                        category = java.net.URLDecoder.decode(category, "UTF-8");
                        examinations = new ExaminationService().getExaminationsByCategory(category);
                    } else if (query != null && query.contains("keyword=")) {
                        String keyword = query.substring(query.indexOf("keyword=") + 8);
                        keyword = java.net.URLDecoder.decode(keyword, "UTF-8");
                        examinations = new ExaminationService().searchExaminations(keyword);
                    } else {
                        examinations = new ExaminationService().getAllExaminations();
                    }
                    sendResponse(exchange, "{\"examinations\":" + toJson(examinations) + ",\"count\":" + examinations.size() + "}");
                } else if (path.matches("/api/examinations/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    Examination examination = new ExaminationService().getExaminationById(id);
                    if (examination != null) {
                        sendResponse(exchange, toJson(examination));
                    } else {
                        sendError(exchange, 404, "Examination not found");
                    }
                } else if ("/api/examinations".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Examination examination = new Examination();
                    String name = params.get("name");
                    String category = params.get("category");
                    String priceStr = params.get("price");
                    if (name == null || name.isEmpty()) {
                        sendError(exchange, 400, "name is required");
                        return;
                    }
                    if (category == null || category.isEmpty()) {
                        category = "lab";
                    }
                    examination.setName(name);
                    examination.setCategory(category);
                    if (priceStr != null && !priceStr.isEmpty()) {
                        examination.setPrice(new java.math.BigDecimal(priceStr));
                    }
                    if (params.get("dept") != null) examination.setDept(params.get("dept"));
                    if (params.get("remark") != null) examination.setRemark(params.get("remark"));
                    int result = new ExaminationService().addExamination(examination);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/examinations/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Examination examination = new ExaminationService().getExaminationById(id);
                    if (examination == null) {
                        sendError(exchange, 404, "Examination not found");
                        return;
                    }
                    if (params.get("name") != null) examination.setName(params.get("name"));
                    if (params.get("category") != null) examination.setCategory(params.get("category"));
                    if (params.get("price") != null && !params.get("price").isEmpty()) {
                        examination.setPrice(new java.math.BigDecimal(params.get("price")));
                    }
                    if (params.get("dept") != null) examination.setDept(params.get("dept"));
                    if (params.get("remark") != null) examination.setRemark(params.get("remark"));
                    int result = new ExaminationService().updateExamination(examination);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/examinations/\\d+") && "DELETE".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    int result = new ExaminationService().deleteExamination(id);
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
