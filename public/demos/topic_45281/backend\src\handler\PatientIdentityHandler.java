package handler;

import bean.Patient;
import bean.PatientIdentity;
import com.sun.net.httpserver.HttpExchange;
import service.PatientIdentityService;
import util.ApiResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class PatientIdentityHandler extends BaseHandler {
    private final PatientIdentityService service = new PatientIdentityService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleCors(exchange)) return;
        try {
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();
            Map<String, String> query = parseQuery(exchange.getRequestURI().getQuery());

            if ("/api/patient-identities/check-duplicate".equals(path) && "GET".equals(method)) {
                handleCheckDuplicate(exchange, query);
            } else if ("/api/patient-identities/rebuild".equals(path) && "POST".equals(method)) {
                service.rebuildForAllPatients();
                sendResponse(exchange, ApiResponse.success("患者主索引已重建"));
            } else if (path.matches("/api/patient-identities/patient/\\d+") && "GET".equals(method)) {
                long patientId = Long.parseLong(path.substring(path.lastIndexOf('/') + 1));
                List<PatientIdentity> list = service.getByPatient(patientId);
                sendResponse(exchange, ApiResponse.successBuilder().put("identities", list).count(list.size()).build());
            } else {
                sendError(exchange, 404, "Not Found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendError(exchange, 500, e.getMessage());
        } finally {
            exchange.close();
        }
    }

    private void handleCheckDuplicate(HttpExchange exchange, Map<String, String> query) throws IOException {
        Long excludePatientId = parseLong(query.get("excludePatientId"));
        List<Map<String, Object>> duplicates = service.findDuplicates(
            query.get("idCard"),
            query.get("phone"),
            query.get("medicalInsuranceNo"),
            query.get("medicalRecordNo"),
            excludePatientId
        );
        sendResponse(exchange, ApiResponse.successBuilder()
            .put("duplicates", duplicates)
            .put("hasDuplicate", !duplicates.isEmpty())
            .count(duplicates.size())
            .build());
    }

    private Long parseLong(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try { return Long.parseLong(value.trim()); } catch (Exception e) { return null; }
    }
}
