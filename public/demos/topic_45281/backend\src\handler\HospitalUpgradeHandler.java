package handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.google.gson.Gson;
import bean.*;
import service.*;
import java.io.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

public class HospitalUpgradeHandler implements HttpHandler {
    private final Gson gson = new Gson();

    private final TriageQueueService triageQueueService = new TriageQueueService();
    private final QueueDisplayService queueDisplayService = new QueueDisplayService();
    private final MedicalInsuranceSettlementService insuranceSettlementService = new MedicalInsuranceSettlementService();
    private final DrugSupplierService drugSupplierService = new DrugSupplierService();
    private final DrugPurchaseOrderService drugPurchaseOrderService = new DrugPurchaseOrderService();
    private final DrugPurchaseItemService drugPurchaseItemService = new DrugPurchaseItemService();
    private final DrugTransferOrderService drugTransferOrderService = new DrugTransferOrderService();
    private final DrugTransferItemService drugTransferItemService = new DrugTransferItemService();
    private final PharmacyWindowService pharmacyWindowService = new PharmacyWindowService();
    private final DrugInventoryLedgerService drugInventoryLedgerService = new DrugInventoryLedgerService();
    private final FinanceGeneralLedgerService financeGeneralLedgerService = new FinanceGeneralLedgerService();
    private final FinanceBudgetService financeBudgetService = new FinanceBudgetService();
    private final PayrollService payrollService = new PayrollService();
    private final CostAccountingDetailService costAccountingDetailService = new CostAccountingDetailService();
    private final OrderExecutionService orderExecutionService = new OrderExecutionService();
    private final SpecimenService specimenService = new SpecimenService();
    private final ExaminationReportService examinationReportService = new ExaminationReportService();
    private final TreatmentExecutionService treatmentExecutionService = new TreatmentExecutionService();

    private int parseIdFromPath(String path) {
        int lastSlash = path.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < path.length() - 1) {
            try { return Integer.parseInt(path.substring(lastSlash + 1)); } catch (NumberFormatException e) { e.printStackTrace(); }
        }
        return -1;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        if ("OPTIONS".equals(exchange.getRequestMethod())) { exchange.sendResponseHeaders(204, -1); return; }

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        Map<String, String> params = parseQuery(exchange.getRequestURI().getQuery());

        try {
            if ("DELETE".equals(method)) {
                int id = parseIdFromPath(path);
                if (id > 0) {
                    boolean success = false;
                    if (path.startsWith("/api/triage-queue")) success = triageQueueService.delete(id) > 0;
                    else if (path.startsWith("/api/queue-display")) success = queueDisplayService.delete(id) > 0;
                    else if (path.startsWith("/api/insurance-settlement")) success = insuranceSettlementService.delete(id) > 0;
                    else if (path.startsWith("/api/drug-suppliers")) success = drugSupplierService.delete(id) > 0;
                    else if (path.startsWith("/api/drug-purchase-orders")) success = drugPurchaseOrderService.cancel(id) > 0;
                    else if (path.startsWith("/api/drug-purchase-items")) success = drugPurchaseItemService.delete(id) > 0;
                    else if (path.startsWith("/api/drug-transfer-orders")) success = drugTransferOrderService.cancel(id) > 0;
                    else if (path.startsWith("/api/drug-transfer-items")) success = drugTransferItemService.delete(id) > 0;
                    else if (path.startsWith("/api/pharmacy-windows")) success = pharmacyWindowService.delete(id) > 0;
                    else if (path.startsWith("/api/drug-inventory-ledger")) success = drugInventoryLedgerService.delete(id) > 0;
                    else if (path.startsWith("/api/finance-general-ledger")) success = financeGeneralLedgerService.voidEntry(id) > 0;
                    else if (path.startsWith("/api/finance-budgets")) success = financeBudgetService.voidBudget(id) > 0;
                    else if (path.startsWith("/api/payroll")) success = payrollService.voidPayroll(id) > 0;
                    else if (path.startsWith("/api/cost-accounting-detail")) success = costAccountingDetailService.delete(id) > 0;
                    else if (path.startsWith("/api/order-execution")) success = orderExecutionService.delete(id) > 0;
                    else if (path.startsWith("/api/specimens")) success = specimenService.delete(id) > 0;
                    else if (path.startsWith("/api/examination-reports")) success = examinationReportService.voidReport(id) > 0;
                    else if (path.startsWith("/api/treatment-execution")) success = treatmentExecutionService.delete(id) > 0;
                    else { sendResponse(exchange, 404, "{\"error\":\"Not found\"}"); return; }
                    sendResponse(exchange, 200, "{\"success\":" + success + "}");
                } else {
                    sendResponse(exchange, 400, "{\"error\":\"Invalid id\"}");
                }
                return;
            }
            if (path.startsWith("/api/triage-queue")) handleTriageQueue(exchange, method, params);
            else if (path.startsWith("/api/queue-display")) handleQueueDisplay(exchange, method, params);
            else if (path.startsWith("/api/insurance-settlement")) handleInsuranceSettlement(exchange, method, params);
            else if (path.startsWith("/api/drug-suppliers")) handleDrugSuppliers(exchange, method, params);
            else if (path.startsWith("/api/drug-purchase-orders")) handleDrugPurchaseOrders(exchange, method, params);
            else if (path.startsWith("/api/drug-purchase-items")) handleDrugPurchaseItems(exchange, method, params);
            else if (path.startsWith("/api/drug-transfer-orders")) handleDrugTransferOrders(exchange, method, params);
            else if (path.startsWith("/api/drug-transfer-items")) handleDrugTransferItems(exchange, method, params);
            else if (path.startsWith("/api/pharmacy-windows")) handlePharmacyWindows(exchange, method, params);
            else if (path.startsWith("/api/drug-inventory-ledger")) handleDrugInventoryLedger(exchange, method, params);
            else if (path.startsWith("/api/finance-general-ledger")) handleFinanceGeneralLedger(exchange, method, params);
            else if (path.startsWith("/api/finance-budgets")) handleFinanceBudgets(exchange, method, params);
            else if (path.startsWith("/api/payroll")) handlePayroll(exchange, method, params);
            else if (path.startsWith("/api/cost-accounting-detail")) handleCostAccountingDetail(exchange, method, params);
            else if (path.startsWith("/api/order-execution")) handleOrderExecution(exchange, method, params);
            else if (path.startsWith("/api/specimens")) handleSpecimens(exchange, method, params);
            else if (path.startsWith("/api/examination-reports")) handleExaminationReports(exchange, method, params);
            else if (path.startsWith("/api/treatment-execution")) handleTreatmentExecution(exchange, method, params);
            else sendResponse(exchange, 404, "{\"error\":\"Not found\"}");
        } catch (Exception e) {
            e.printStackTrace();
            sendResponse(exchange, 500, "{\"error\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }

    private void handleTriageQueue(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String deptId = params.getOrDefault("deptId", "");
            String doctorId = params.getOrDefault("doctorId", "");
            String status = params.getOrDefault("status", "");
            List<TriageQueue> list = triageQueueService.getAll(
                deptId.isEmpty() ? null : Integer.parseInt(deptId),
                doctorId.isEmpty() ? null : Integer.parseInt(doctorId),
                status.isEmpty() ? null : status);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            TriageQueue q = gson.fromJson(body, TriageQueue.class);
            int id = triageQueueService.add(q);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            TriageQueue q = gson.fromJson(body, TriageQueue.class);
            int rows = triageQueueService.update(q);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleQueueDisplay(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String deptId = params.getOrDefault("deptId", "");
            List<QueueDisplay> list = queueDisplayService.getByDept(deptId.isEmpty() ? null : Integer.parseInt(deptId));
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            QueueDisplay q = gson.fromJson(body, QueueDisplay.class);
            int id = queueDisplayService.addOrReplace(q);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        }
    }

    private void handleInsuranceSettlement(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String patientId = params.getOrDefault("patientId", "");
            List<MedicalInsuranceSettlement> list = insuranceSettlementService.getByPatient(
                patientId.isEmpty() ? null : Integer.parseInt(patientId));
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            MedicalInsuranceSettlement s = gson.fromJson(body, MedicalInsuranceSettlement.class);
            s.setStatus("settled");
            int id = insuranceSettlementService.add(s);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        }
    }

    private void handleDrugSuppliers(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String keyword = params.getOrDefault("keyword", "");
            List<DrugSupplier> list = drugSupplierService.getAll(keyword.isEmpty() ? null : keyword);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            DrugSupplier s = gson.fromJson(body, DrugSupplier.class);
            int id = drugSupplierService.add(s);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            DrugSupplier s = gson.fromJson(body, DrugSupplier.class);
            int rows = drugSupplierService.update(s);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleDrugPurchaseOrders(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String status = params.getOrDefault("status", "");
            List<DrugPurchaseOrder> list = drugPurchaseOrderService.getAll(status.isEmpty() ? null : status);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            DrugPurchaseOrder o = gson.fromJson(body, DrugPurchaseOrder.class);
            o.setOrderStatus("draft");
            int id = drugPurchaseOrderService.add(o);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            DrugPurchaseOrder o = gson.fromJson(body, DrugPurchaseOrder.class);
            int rows = drugPurchaseOrderService.update(o);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleDrugPurchaseItems(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String purchaseId = params.getOrDefault("purchaseId", "");
            List<DrugPurchaseItem> list = drugPurchaseItemService.getByPurchaseId(
                purchaseId.isEmpty() ? null : Integer.parseInt(purchaseId));
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            List<DrugPurchaseItem> items = gson.fromJson(body, new com.google.gson.reflect.TypeToken<List<DrugPurchaseItem>>(){}.getType());
            int[] ids = drugPurchaseItemService.batchAdd(items);
            List<Integer> idList = new ArrayList<>();
            for (int id : ids) idList.add(id);
            sendResponse(exchange, 200, gson.toJson(map("ids", idList, "success", true)));
        }
    }

    private void handleDrugTransferOrders(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String status = params.getOrDefault("status", "");
            List<DrugTransferOrder> list = drugTransferOrderService.getAll(status.isEmpty() ? null : status);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            DrugTransferOrder o = gson.fromJson(body, DrugTransferOrder.class);
            o.setStatus("draft");
            int id = drugTransferOrderService.add(o);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            DrugTransferOrder o = gson.fromJson(body, DrugTransferOrder.class);
            int rows = drugTransferOrderService.update(o);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleDrugTransferItems(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String transferId = params.getOrDefault("transferId", "");
            List<DrugTransferItem> list = drugTransferItemService.getByTransferId(
                transferId.isEmpty() ? null : Integer.parseInt(transferId));
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            List<DrugTransferItem> items = gson.fromJson(body, new com.google.gson.reflect.TypeToken<List<DrugTransferItem>>(){}.getType());
            drugTransferItemService.batchAdd(items);
            sendResponse(exchange, 200, gson.toJson(map("success", true)));
        }
    }

    private void handlePharmacyWindows(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String type = params.getOrDefault("type", "");
            List<PharmacyWindow> list = pharmacyWindowService.getAll(type.isEmpty() ? null : type);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            PharmacyWindow w = gson.fromJson(body, PharmacyWindow.class);
            int id = pharmacyWindowService.add(w);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        }
    }

    private void handleDrugInventoryLedger(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String warehouse = params.getOrDefault("warehouse", "");
            String drugName = params.getOrDefault("drugName", "");
            List<DrugInventoryLedger> list = drugInventoryLedgerService.getAll(
                warehouse.isEmpty() ? null : warehouse, drugName.isEmpty() ? null : drugName);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            DrugInventoryLedger l = gson.fromJson(body, DrugInventoryLedger.class);
            int id = drugInventoryLedgerService.add(l);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            DrugInventoryLedger l = gson.fromJson(body, DrugInventoryLedger.class);
            int rows = drugInventoryLedgerService.update(l);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleFinanceGeneralLedger(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String period = params.getOrDefault("period", "");
            String subject = params.getOrDefault("subject", "");
            List<FinanceGeneralLedger> list = financeGeneralLedgerService.getAll(
                period.isEmpty() ? null : period, subject.isEmpty() ? null : subject);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            FinanceGeneralLedger l = gson.fromJson(body, FinanceGeneralLedger.class);
            l.setVoucherStatus("draft");
            int id = financeGeneralLedgerService.add(l);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            FinanceGeneralLedger l = gson.fromJson(body, FinanceGeneralLedger.class);
            int rows = financeGeneralLedgerService.update(l);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleFinanceBudgets(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String year = params.getOrDefault("year", "");
            String deptId = params.getOrDefault("deptId", "");
            List<FinanceBudget> list = financeBudgetService.getAll(
                year.isEmpty() ? null : year, deptId.isEmpty() ? null : Integer.parseInt(deptId));
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            FinanceBudget b = gson.fromJson(body, FinanceBudget.class);
            b.setStatus("draft");
            int id = financeBudgetService.add(b);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            FinanceBudget b = gson.fromJson(body, FinanceBudget.class);
            int rows = financeBudgetService.update(b);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handlePayroll(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String period = params.getOrDefault("period", "");
            String deptId = params.getOrDefault("deptId", "");
            List<Payroll> list = payrollService.getAll(
                period.isEmpty() ? null : period, deptId.isEmpty() ? null : Integer.parseInt(deptId));
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            Payroll p = gson.fromJson(body, Payroll.class);
            p.setPayStatus("pending");
            int id = payrollService.add(p);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            Payroll p = gson.fromJson(body, Payroll.class);
            int rows = payrollService.update(p);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleCostAccountingDetail(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String period = params.getOrDefault("period", "");
            String deptId = params.getOrDefault("deptId", "");
            List<CostAccountingDetail> list = costAccountingDetailService.getAll(
                period.isEmpty() ? null : period, deptId.isEmpty() ? null : Integer.parseInt(deptId));
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            CostAccountingDetail d = gson.fromJson(body, CostAccountingDetail.class);
            d.setStatus("draft");
            int id = costAccountingDetailService.add(d);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        }
    }

    private void handleOrderExecution(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String patientId = params.getOrDefault("patientId", "");
            String status = params.getOrDefault("status", "");
            List<OrderExecution> list = orderExecutionService.getAll(
                patientId.isEmpty() ? null : Integer.parseInt(patientId), status.isEmpty() ? null : status);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            OrderExecution e = gson.fromJson(body, OrderExecution.class);
            e.setExecutionStatus("pending");
            int id = orderExecutionService.add(e);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            OrderExecution e = gson.fromJson(body, OrderExecution.class);
            int rows = orderExecutionService.update(e);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleSpecimens(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String patientId = params.getOrDefault("patientId", "");
            String status = params.getOrDefault("status", "");
            List<Specimen> list = specimenService.getAll(
                patientId.isEmpty() ? null : Integer.parseInt(patientId), status.isEmpty() ? null : status);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            Specimen s = gson.fromJson(body, Specimen.class);
            s.setStatus("collected");
            int id = specimenService.add(s);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            Specimen s = gson.fromJson(body, Specimen.class);
            int rows = specimenService.update(s);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleExaminationReports(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String patientId = params.getOrDefault("patientId", "");
            String type = params.getOrDefault("type", "");
            List<ExaminationReport> list = examinationReportService.getAll(
                patientId.isEmpty() ? null : Integer.parseInt(patientId), type.isEmpty() ? null : type);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            ExaminationReport r = gson.fromJson(body, ExaminationReport.class);
            r.setReportStatus("draft");
            int id = examinationReportService.add(r);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            ExaminationReport r = gson.fromJson(body, ExaminationReport.class);
            int rows = examinationReportService.update(r);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private void handleTreatmentExecution(HttpExchange exchange, String method, Map<String, String> params) throws IOException {
        if ("GET".equals(method)) {
            String patientId = params.getOrDefault("patientId", "");
            String status = params.getOrDefault("status", "");
            List<TreatmentExecution> list = treatmentExecutionService.getAll(
                patientId.isEmpty() ? null : Integer.parseInt(patientId), status.isEmpty() ? null : status);
            sendResponse(exchange, 200, gson.toJson(list));
        } else if ("POST".equals(method)) {
            String body = getRequestBody(exchange);
            TreatmentExecution e = gson.fromJson(body, TreatmentExecution.class);
            e.setExecutionStatus("pending");
            int id = treatmentExecutionService.add(e);
            sendResponse(exchange, 200, gson.toJson(map("id", id, "success", id > 0)));
        } else if ("PUT".equals(method)) {
            String body = getRequestBody(exchange);
            TreatmentExecution e = gson.fromJson(body, TreatmentExecution.class);
            int rows = treatmentExecutionService.update(e);
            sendResponse(exchange, 200, gson.toJson(map("success", rows > 0)));
        }
    }

    private Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new HashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(kv[i].toString(), kv[i + 1]);
        return m;
    }

    private String getRequestBody(HttpExchange exchange) throws IOException {
        return new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))
            .lines().collect(Collectors.joining());
    }

    private Map<String, String> parseQuery(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isEmpty()) return params;
        for (String param : query.split("&")) {
            String[] pair = param.split("=", 2);
            if (pair.length == 2) {
                try { params.put(pair[0], URLDecoder.decode(pair[1], "UTF-8")); }
                catch (Exception e) { params.put(pair[0], pair[1]); }
            }
        }
        return params;
    }

    private void sendResponse(HttpExchange exchange, int code, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); os.flush(); }
    }
}