package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import bean.*;
import service.*;

public class AuthHandler extends BaseHandler {

    private AuthService authService = new AuthService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (handleCors(exchange)) return;
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");

        try {
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();

            if ("/api/auth/login".equals(path) && "POST".equals(method)) {
                String body = getRequestBody(exchange);
                Map<String, String> params = parseJson(body);
                String loginName = params.get("loginName");
                String password = params.get("password");
                String ip = exchange.getRemoteAddress().getAddress().getHostAddress();

                AuthService.AuthResult result = authService.login(loginName, password, ip);

                if (result.isSuccess()) {
                    LoginAccount account = result.getAccount();
                    String json = buildLoginResponse(account);
                    sendResponse(exchange, json);
                } else {
                    sendResponse(exchange, "{\"success\":false,\"error\":\"" + escapeJson(result.getErrorMessage()) + "\"}");
                }

            } else if ("/api/auth/logout".equals(path) && "POST".equals(method)) {
                sendResponse(exchange, "{\"success\":true}");

            } else if ("/api/auth/reset-password".equals(path) && "POST".equals(method)) {
                String body = getRequestBody(exchange);
                Map<String, String> params = parseJson(body);
                int accountId = Integer.parseInt(params.getOrDefault("accountId", "0"));
                boolean ok = authService.resetPassword(accountId);
                sendResponse(exchange, "{\"success\":" + ok + "}");

            } else if ("/api/auth/unlock".equals(path) && "POST".equals(method)) {
                String body = getRequestBody(exchange);
                Map<String, String> params = parseJson(body);
                int accountId = Integer.parseInt(params.getOrDefault("accountId", "0"));
                boolean ok = authService.unlockAccount(accountId);
                sendResponse(exchange, "{\"success\":" + ok + "}");

            } else if ("/api/auth/status".equals(path) && "GET".equals(method)) {
                String query = exchange.getRequestURI().getQuery();
                Map<String, String> queryParams = parseQuery(query);
                String accIdStr = queryParams.get("accountId");
                if (accIdStr != null) {
                    int accId = Integer.parseInt(accIdStr);
                    LoginAccount account = authService.getAccountById(accId);
                    if (account != null) {
                        sendResponse(exchange, "{\"id\":" + account.getId() + ",\"status\":\"" + account.getStatus() + "\",\"loginFailCount\":" + account.getLoginFailCount() + "}");
                    } else {
                        sendError(exchange, 404, "Account not found");
                    }
                } else {
                    sendError(exchange, 400, "Missing accountId");
                }

            } else if ("/api/auth/accounts".equals(path) && "GET".equals(method)) {
                String query = exchange.getRequestURI().getQuery();
                Map<String, String> queryParams = parseQuery(query);
                String userType = queryParams.get("userType");
                String status = queryParams.get("status");

                List<LoginAccount> accounts;
                if (userType != null && !userType.isEmpty()) {
                    accounts = authService.getAccountsByType(userType);
                } else if (status != null && !status.isEmpty()) {
                    accounts = authService.getAccountsByStatus(status);
                } else {
                    accounts = authService.getAllAccounts();
                }
                sendResponse(exchange, "{\"success\":true,\"accounts\":" + toJson(accounts) + ",\"count\":" + accounts.size() + "}");

            } else if (path.matches("/api/auth/accounts/\\d+") && "PUT".equals(method)) {
                String idStr = path.substring(path.lastIndexOf('/') + 1);
                int id = Integer.parseInt(idStr);
                String body = getRequestBody(exchange);
                Map<String, String> params = parseJson(body);
                LoginAccount account = authService.getAccountById(id);
                if (account == null) {
                    sendError(exchange, 404, "Account not found");
                    return;
                }
                if (params.containsKey("status")) {
                    authService.unlockAccount(id);
                    if ("DISABLED".equals(params.get("status")) || "LOCKED".equals(params.get("status"))) {
                        new dao.impl.LoginAccountDAOImpl().updateStatus(id, params.get("status"));
                    }
                }
                sendResponse(exchange, "{\"success\":true}");

            } else if ("/api/auth/login-logs".equals(path) && "GET".equals(method)) {
                String query = exchange.getRequestURI().getQuery();
                Map<String, String> queryParams = parseQuery(query);
                int offset = 0;
                int limit = 50;
                try {
                    if (queryParams.containsKey("offset")) offset = Integer.parseInt(queryParams.get("offset"));
                    if (queryParams.containsKey("limit")) limit = Integer.parseInt(queryParams.get("limit"));
                } catch (NumberFormatException ignored) {}
                List<LoginLog> logs = authService.getLoginLogs(offset, limit);
                int total = authService.getLoginLogCount();
                sendResponse(exchange, "{\"success\":true,\"logs\":" + toJson(logs) + ",\"total\":" + total + ",\"offset\":" + offset + ",\"limit\":" + limit + "}");

            } else if ("/api/auth/create-account".equals(path) && "POST".equals(method)) {
                String body = getRequestBody(exchange);
                Map<String, String> params = parseJson(body);
                String loginName = params.get("loginName");
                String userType = params.get("userType");
                Integer relateId = null;
                if (params.get("relateId") != null && !params.get("relateId").isEmpty()) {
                    relateId = Integer.parseInt(params.get("relateId"));
                }
                int id = authService.createAccount(loginName, userType, relateId);
                sendResponse(exchange, "{\"success\":" + (id > 0) + ",\"id\":" + id + "}");

            } else {
                sendError(exchange, 404, "Auth endpoint not found");
            }

        } catch (Exception e) {
            e.printStackTrace();
            sendError(exchange, 500, e.getMessage());
        } finally {
            exchange.close();
        }
    }

    private String buildLoginResponse(LoginAccount account) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"success\":true,\"account\":{");
        sb.append("\"id\":").append(account.getId()).append(",");
        sb.append("\"loginName\":\"").append(escapeJson(account.getLoginName())).append("\",");
        sb.append("\"userType\":\"").append(account.getUserType()).append("\",");

        if ("DOCTOR".equals(account.getUserType()) && account.getRelateId() != null) {
            Doctor doctor = new DoctorService().getDoctorById(account.getRelateId());
            if (doctor != null) {
                sb.append("\"doctorInfo\":{");
                sb.append("\"id\":").append(doctor.getId()).append(",");
                sb.append("\"workNo\":\"").append(escapeJson(doctor.getWorkNo())).append("\",");
                sb.append("\"name\":\"").append(escapeJson(doctor.getName())).append("\",");
                sb.append("\"dept\":\"").append(escapeJson(doctor.getDept())).append("\",");
                sb.append("\"title\":\"").append(escapeJson(doctor.getTitle())).append("\"");
                sb.append("},");

                if (doctor.getDepartmentId() != null) {
                    Department dept = new DepartmentService().getDepartmentById(doctor.getDepartmentId());
                    if (dept != null) {
                        sb.append("\"department\":{");
                        sb.append("\"id\":").append(dept.getId()).append(",");
                        sb.append("\"name\":\"").append(escapeJson(dept.getName())).append("\"");
                        sb.append("},");
                    }
                }
            }
        } else if ("PATIENT".equals(account.getUserType()) && account.getRelateId() != null) {
            Patient patient = new PatientService().getPatientById(account.getRelateId());
            if (patient != null) {
                sb.append("\"patientInfo\":{");
                sb.append("\"id\":").append(patient.getId()).append(",");
                sb.append("\"hospitalId\":\"").append(escapeJson(patient.getHospitalId())).append("\",");
                sb.append("\"name\":\"").append(escapeJson(patient.getName())).append("\",");
                sb.append("\"gender\":\"").append(escapeJson(patient.getGender())).append("\"");
                sb.append("},");
            }
        } else if ("ADMIN".equals(account.getUserType())) {
            sb.append("\"adminInfo\":{\"roleName\":\"信息科管理员\"},");
        }

        sb.append("\"status\":\"").append(account.getStatus()).append("\"");
        sb.append("}}");
        return sb.toString();
    }
}