package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Drug;
import bean.Prescription;
import bean.InventoryLog;
import service.DrugService;
import service.InventoryLogService;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.Date;

public class DrugHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/drugs".equals(path)) {
                    if ("GET".equals(method)) {
                        String query = exchange.getRequestURI().getQuery();
                        if (query != null && query.contains("keyword=")) {
                            String keyword = query.substring(query.indexOf("keyword=") + 8);
                            try {
                                keyword = java.net.URLDecoder.decode(keyword, "UTF-8");
                            } catch (Exception e) { e.printStackTrace(); }
                            List<Drug> drugs = new DrugService().searchDrugs(keyword);
                            sendResponse(exchange, "{\"drugs\":" + toJson(drugs) + ",\"count\":" + drugs.size() + "}");
                        } else {
                            List<Drug> drugs = new DrugService().getAllDrugs();
                            sendResponse(exchange, "{\"drugs\":" + toJson(drugs) + ",\"count\":" + drugs.size() + "}");
                        }
                    } else if ("POST".equals(method)) {
                        String body = getRequestBody(exchange);
                        Map<String, String> params = parseJson(body);
                        Drug drug = new Drug();
                        if (params.get("name") != null) drug.setName(params.get("name"));
                        if (params.get("spec") != null) drug.setSpec(params.get("spec"));
                        if (params.get("unit") != null) drug.setUnit(params.get("unit"));
                        if (params.get("price") != null && !params.get("price").isEmpty()) drug.setPrice(new java.math.BigDecimal(params.get("price")));
                        if (params.get("stock") != null && !params.get("stock").isEmpty()) drug.setStock(Integer.parseInt(params.get("stock")));
                        if (params.get("stockWarn") != null && !params.get("stockWarn").isEmpty()) drug.setStockWarn(Integer.parseInt(params.get("stockWarn")));
                        if (params.get("expireDate") != null && !params.get("expireDate").isEmpty()) {
                            try {
                                drug.setExpireDate(java.sql.Date.valueOf(params.get("expireDate")));
                            } catch (Exception e) { e.printStackTrace(); }
                        }
                        if (params.get("remark") != null) drug.setRemark(params.get("remark"));
                        int result = new DrugService().addDrug(drug);
                        if (result > 0 && drug.getStock() > 0) {
                            InventoryLog log = new InventoryLog();
                            log.setDrugId(result);
                            log.setChangeType("in");
                            log.setChangeNum(drug.getStock());
                            log.setBeforeStock(0);
                            log.setAfterStock(drug.getStock());
                            log.setOperator("system");
                            log.setReason("新增药品入库");
                            new InventoryLogService().addInventoryLog(log);
                        }
                        sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                    }
                } else if ("/api/drugs/warnings".equals(path) && "GET".equals(method)) {
                    DrugService.DrugWarnings warnings = new DrugService().getDrugWarnings();
                    StringBuilder sb = new StringBuilder("{");
                    sb.append("\"lowStock\":").append(toJson(warnings.lowStock)).append(",");
                    sb.append("\"expiring\":").append(toJson(warnings.expiring)).append(",");
                    sb.append("\"expired\":").append(toJson(warnings.expired)).append("}");
                    sendResponse(exchange, sb.toString());
                } else if (path.matches("/api/drugs/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Drug existing = new DrugService().getDrugById(id);
                    int oldStock = existing != null ? existing.getStock() : 0;
                    Drug drug = new Drug();
                    drug.setId(id);
                    if (params.get("name") != null) drug.setName(params.get("name"));
                    if (params.get("spec") != null) drug.setSpec(params.get("spec"));
                    if (params.get("unit") != null) drug.setUnit(params.get("unit"));
                    if (params.get("price") != null && !params.get("price").isEmpty()) drug.setPrice(new java.math.BigDecimal(params.get("price")));
                    if (params.get("stock") != null && !params.get("stock").isEmpty()) drug.setStock(Integer.parseInt(params.get("stock")));
                    if (params.get("stockWarn") != null && !params.get("stockWarn").isEmpty()) drug.setStockWarn(Integer.parseInt(params.get("stockWarn")));
                    if (params.get("expireDate") != null && !params.get("expireDate").isEmpty()) {
                        try {
                            drug.setExpireDate(java.sql.Date.valueOf(params.get("expireDate")));
                        } catch (Exception e) { e.printStackTrace(); }
                    }
                    if (params.get("remark") != null) drug.setRemark(params.get("remark"));
                    int result = new DrugService().updateDrug(drug);
                    if (result > 0 && params.get("stock") != null && !params.get("stock").isEmpty()) {
                        int newStock = Integer.parseInt(params.get("stock"));
                        if (newStock != oldStock) {
                            InventoryLog log = new InventoryLog();
                            log.setDrugId(id);
                            log.setChangeType(newStock > oldStock ? "in" : "adjust");
                            log.setChangeNum(Math.abs(newStock - oldStock));
                            log.setBeforeStock(oldStock);
                            log.setAfterStock(newStock);
                            log.setOperator("system");
                            log.setReason(newStock > oldStock ? "药品入库补货" : "库存调整");
                            new InventoryLogService().addInventoryLog(log);
                        }
                    }
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/drugs/\\d+") && "DELETE".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    if (!new DrugService().canDelete(id)) {
                        sendError(exchange, 400, "Drug is referenced by prescription or inventory log");
                        return;
                    }
                    int result = new DrugService().deleteDrug(id);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/drugs/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    Drug drug = new DrugService().getDrugById(id);
                    if (drug != null) {
                        sendResponse(exchange, toJson(drug));
                    } else {
                        sendError(exchange, 404, "Drug not found");
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
