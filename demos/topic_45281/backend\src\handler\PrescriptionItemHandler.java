package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Drug;
import bean.Prescription;
import bean.PrescriptionItem;
import service.PrescriptionItemService;
import service.DrugService;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public class PrescriptionItemHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/prescription-items".equals(path) && "GET".equals(method)) {
                    List<PrescriptionItem> items = new PrescriptionItemService().getAllPrescriptionItems();
                    sendResponse(exchange, "{\"items\":" + toJson(items) + ",\"count\":" + items.size() + "}");
                } else if (path.matches("/api/prescription-items/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int prescriptionId = Integer.parseInt(idStr);
                    List<PrescriptionItem> items = new PrescriptionItemService().getPrescriptionItemsByPrescriptionId(prescriptionId);
                    sendResponse(exchange, "{\"items\":" + toJson(items) + ",\"count\":" + items.size() + "}");
                } else if ("/api/prescription-items".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    PrescriptionItem item = new PrescriptionItem();
                    if (params.get("prescriptionId") != null && !params.get("prescriptionId").isEmpty()) {
                        item.setPrescriptionId(Integer.parseInt(params.get("prescriptionId")));
                    }
                    if (params.get("drugId") != null && !params.get("drugId").isEmpty()) {
                        item.setDrugId(Integer.parseInt(params.get("drugId")));
                    }
                    if (params.get("num") != null && !params.get("num").isEmpty()) {
                        item.setNum(Integer.parseInt(params.get("num")));
                    }
                    if (params.get("drugPrice") != null && !params.get("drugPrice").isEmpty()) {
                        item.setDrugPrice(new java.math.BigDecimal(params.get("drugPrice")));
                    }
                    if (params.get("usage") != null) item.setUsage(params.get("usage"));
                    if (params.get("days") != null && !params.get("days").isEmpty()) {
                        item.setDays(Integer.parseInt(params.get("days")));
                    }
                    if (item.getDrugId() > 0) {
                        Drug drug = new DrugService().getDrugById(item.getDrugId());
                        if (drug != null) {
                            if (item.getDrugName() == null) item.setDrugName(drug.getName());
                            if (item.getDrugSpec() == null) item.setDrugSpec(drug.getSpec());
                            if (item.getDrugPrice() == null) item.setDrugPrice(drug.getPrice());
                        }
                    }
                    int result = new PrescriptionItemService().addPrescriptionItem(item);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if ("/api/prescription-items".equals(path) && "PUT".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    PrescriptionItem item = new PrescriptionItem();
                    if (params.get("id") != null && !params.get("id").isEmpty()) {
                        item.setId(Integer.parseInt(params.get("id")));
                    }
                    if (params.get("prescriptionId") != null && !params.get("prescriptionId").isEmpty()) {
                        item.setPrescriptionId(Integer.parseInt(params.get("prescriptionId")));
                    }
                    if (params.get("drugId") != null && !params.get("drugId").isEmpty()) {
                        item.setDrugId(Integer.parseInt(params.get("drugId")));
                    }
                    if (params.get("num") != null && !params.get("num").isEmpty()) {
                        item.setNum(Integer.parseInt(params.get("num")));
                    }
                    if (params.get("drugPrice") != null && !params.get("drugPrice").isEmpty()) {
                        item.setDrugPrice(new java.math.BigDecimal(params.get("drugPrice")));
                    }
                    if (params.get("usage") != null) item.setUsage(params.get("usage"));
                    if (params.get("days") != null && !params.get("days").isEmpty()) {
                        item.setDays(Integer.parseInt(params.get("days")));
                    }
                    if (params.get("drugName") != null) item.setDrugName(params.get("drugName"));
                    if (params.get("drugSpec") != null) item.setDrugSpec(params.get("drugSpec"));
                    int result = new PrescriptionItemService().updatePrescriptionItem(item);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if ("/api/prescription-items".equals(path) && "DELETE".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    if (params.get("id") != null && !params.get("id").isEmpty()) {
                        int id = Integer.parseInt(params.get("id"));
                        int result = new PrescriptionItemService().deletePrescriptionItem(id);
                        sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                    } else {
                        sendError(exchange, 400, "Missing id parameter");
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
