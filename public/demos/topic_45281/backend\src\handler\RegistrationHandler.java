package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Registration;
import service.RegistrationService;
import service.PatientService;
import service.DoctorService;
import java.util.List;
import java.util.Map;

public class RegistrationHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/registrations".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<Registration> registrations;
                    if (query != null && query.contains("patientId=")) {
                        String patientIdStr = query.substring(query.indexOf("patientId=") + 10);
                        try {
                            patientIdStr = java.net.URLDecoder.decode(patientIdStr, "UTF-8");
                            int patientId = Integer.parseInt(patientIdStr);
                            registrations = new RegistrationService().getRegistrationsByPatientId(patientId);
                        } catch (Exception e) {
                            registrations = new RegistrationService().getAllRegistrations();
                        }
                    } else {
                        registrations = new RegistrationService().getAllRegistrations();
                    }
                    sendResponse(exchange, "{\"registrations\":" + toJson(registrations) + ",\"count\":" + registrations.size() + "}");
                } else if ("/api/registrations".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Registration registration = new Registration();
                    if (params.get("patientId") != null && !params.get("patientId").isEmpty()) {
                        registration.setPatientId(Integer.parseInt(params.get("patientId")));
                    }
                    if (params.get("patientName") != null) registration.setPatientName(params.get("patientName"));
                    if (params.get("doctorId") != null && !params.get("doctorId").isEmpty()) {
                        registration.setDoctorId(Integer.parseInt(params.get("doctorId")));
                    }
                    if (params.get("doctorName") != null) registration.setDoctorName(params.get("doctorName"));
                    if (params.get("dept") != null) registration.setDept(params.get("dept"));
                    if (params.get("regFee") != null && !params.get("regFee").isEmpty()) {
                        registration.setRegFee(new java.math.BigDecimal(params.get("regFee")));
                    }
                    if (params.get("regStatus") != null) {
                        String s = params.get("regStatus");
                        if ("已挂号".equals(s)) s = "waiting";
                        registration.setRegStatus(s);
                    } else {
                        registration.setRegStatus("waiting");
                    }
                    if (params.get("queueNo") != null) registration.setQueueNo(params.get("queueNo"));
                    if (params.get("dept") != null) registration.setDept(params.get("dept"));
                    if (registration.getQueueNo() == null || registration.getQueueNo().isEmpty()) {
                        registration.setQueueNo("Q" + (System.currentTimeMillis() % 100000));
                    }
                    if (registration.getRegTime() == null) {
                        registration.setRegTime(new java.util.Date());
                    }
                    if (registration.getPatientName() == null && registration.getPatientId() > 0) {
                        bean.Patient p = new PatientService().getPatientById(registration.getPatientId());
                        if (p != null) registration.setPatientName(p.getName());
                    }
                    if (registration.getDoctorName() == null && registration.getDoctorId() > 0) {
                        bean.Doctor d = new DoctorService().getDoctorById(registration.getDoctorId());
                        if (d != null) registration.setDoctorName(d.getName());
                    }
                    int result = new RegistrationService().register(registration);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/registrations/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Registration existing = new RegistrationService().getRegistrationById(id);
                    if (existing == null) { sendResponse(exchange, "{\"success\":false,\"error\":\"not found\"}"); return; }
                    if (params.get("regStatus") != null) existing.setRegStatus(params.get("regStatus"));
                    if (params.get("queueNo") != null) existing.setQueueNo(params.get("queueNo"));
                    if (params.get("dept") != null) existing.setDept(params.get("dept"));
                    int result = new RegistrationService().updateRegistration(existing);
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
