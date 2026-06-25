package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Prescription;
import bean.Examination;
import bean.PrescriptionExamination;
import service.PrescriptionExaminationService;
import service.ExaminationService;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public class PrescriptionExaminationHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/prescription-examinations".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<PrescriptionExamination> items;
                    if (query != null && query.contains("prescriptionId=")) {
                        String idStr = query.substring(query.indexOf("prescriptionId=") + 15);
                        int prescriptionId = Integer.parseInt(idStr);
                        items = new PrescriptionExaminationService().getByPrescriptionId(prescriptionId);
                    } else {
                        items = new PrescriptionExaminationService().getAll();
                    }
                    for (PrescriptionExamination pe : items) {
                        if (pe.getExaminationName() == null || pe.getExaminationName().isEmpty() || pe.getExaminationName().contains("?")) {
                            try {
                                Examination exam = new ExaminationService().getExaminationById(pe.getExaminationId());
                                if (exam != null) {
                                    pe.setExaminationName(exam.getName());
                                    if (pe.getCategory() == null || pe.getCategory().isEmpty()) pe.setCategory(exam.getCategory());
                                    if (pe.getDept() == null || pe.getDept().isEmpty()) pe.setDept(exam.getDept());
                                }
                            } catch (Exception e) { e.printStackTrace(); }
                        }
                    }
                    sendResponse(exchange, "{\"items\":" + toJson(items) + ",\"count\":" + items.size() + "}");
                } else if ("/api/prescription-examinations".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    PrescriptionExamination pe = new PrescriptionExamination();
                    if (params.get("prescriptionId") != null && !params.get("prescriptionId").isEmpty()) {
                        pe.setPrescriptionId(Integer.parseInt(params.get("prescriptionId")));
                    }
                    if (params.get("examinationId") != null && !params.get("examinationId").isEmpty()) {
                        pe.setExaminationId(Integer.parseInt(params.get("examinationId")));
                    }
                    if (params.get("examinationName") != null) pe.setExaminationName(params.get("examinationName"));
                    if (params.get("category") != null) pe.setCategory(params.get("category"));
                    if (params.get("quantity") != null && !params.get("quantity").isEmpty()) {
                        pe.setQuantity(Integer.parseInt(params.get("quantity")));
                    } else {
                        pe.setQuantity(1);
                    }
                    if (params.get("price") != null && !params.get("price").isEmpty()) {
                        pe.setPrice(new java.math.BigDecimal(params.get("price")));
                    }
                    if (params.get("totalPrice") != null && !params.get("totalPrice").isEmpty()) {
                        pe.setTotalPrice(new java.math.BigDecimal(params.get("totalPrice")));
                    }
                    if (params.get("dept") != null) pe.setDept(params.get("dept"));
                    if (params.get("remark") != null) pe.setRemark(params.get("remark"));
                    pe.setStatus("pending");
                    int result = new PrescriptionExaminationService().addPrescriptionExamination(pe);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/prescription-examinations/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    
                    if (params.get("result") != null && params.get("status") != null) {
                        PrescriptionExaminationService peService = new PrescriptionExaminationService();
                        peService.updateResult(id, params.get("result"));
                        int statusResult = peService.updateStatus(id, params.get("status"));
                        sendResponse(exchange, "{\"success\":" + (statusResult > 0) + "}");
                    } else if (params.get("result") != null) {
                        int result = new PrescriptionExaminationService().updateResult(id, params.get("result"));
                        sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                    } else if (params.get("status") != null) {
                        int result = new PrescriptionExaminationService().updateStatus(id, params.get("status"));
                        sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                    } else {
                        PrescriptionExamination pe = new PrescriptionExaminationService().getById(id);
                        if (pe == null) {
                            sendError(exchange, 404, "PrescriptionExamination not found");
                            return;
                        }
                        if (params.get("quantity") != null && !params.get("quantity").isEmpty()) {
                            pe.setQuantity(Integer.parseInt(params.get("quantity")));
                        }
                        int result = new PrescriptionExaminationService().updatePrescriptionExamination(pe);
                        sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                    }
                } else if (path.matches("/api/prescription-examinations/\\d+") && "DELETE".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    int result = new PrescriptionExaminationService().deletePrescriptionExamination(id);
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
