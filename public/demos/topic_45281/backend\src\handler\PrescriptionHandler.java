package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Patient;
import bean.Doctor;
import bean.Prescription;
import service.PrescriptionService;
import service.DoctorService;
import service.PatientService;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public class PrescriptionHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/prescriptions".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Prescription prescription = new Prescription();
                    if (params.get("patientId") != null && !params.get("patientId").isEmpty()) {
                        prescription.setPatientId(Integer.parseInt(params.get("patientId")));
                    }
                    if (params.get("doctorId") != null && !params.get("doctorId").isEmpty()) {
                        prescription.setDoctorId(Integer.parseInt(params.get("doctorId")));
                    }
                    if (params.get("registrationId") != null && !params.get("registrationId").isEmpty()) {
                        prescription.setRegistrationId(Integer.parseInt(params.get("registrationId")));
                    }
                    if (params.get("diagnosis") != null) prescription.setDiagnosis(params.get("diagnosis"));
                    if (params.get("items") != null) prescription.setItems(params.get("items"));
                    if (params.get("totalPrice") != null && !params.get("totalPrice").isEmpty()) {
                        prescription.setTotalPrice(new java.math.BigDecimal(params.get("totalPrice")));
                    }
                    String status = params.get("status");
                    if (status == null || status.isEmpty()) {
                        status = "unpaid";
                    }
                    prescription.setStatus(status);
                    int result = new PrescriptionService().addPrescription(prescription);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if ("/api/prescriptions".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<Prescription> prescriptions;
                    if (query != null && query.contains("patientId=")) {
                        String patientIdStr = query.substring(query.indexOf("patientId=") + 10);
                        try {
                            patientIdStr = java.net.URLDecoder.decode(patientIdStr, "UTF-8");
                            int patientId = Integer.parseInt(patientIdStr);
                            prescriptions = new PrescriptionService().getPrescriptionsByPatientId(patientId);
                        } catch (Exception e) {
                            prescriptions = new PrescriptionService().getAllPrescriptions();
                        }
                    } else {
                        prescriptions = new PrescriptionService().getAllPrescriptions();
                    }
                    DoctorService ds = new DoctorService();
                    PatientService ps2 = new PatientService();
                    for (Prescription p : prescriptions) {
                        if (p.getDoctorId() > 0) {
                            Doctor doc = ds.getDoctorById(p.getDoctorId());
                            if (doc != null) p.setDoctorName(doc.getName());
                        }
                        if (p.getPatientId() > 0) {
                            Patient pat = ps2.getPatientById(p.getPatientId());
                            if (pat != null) p.setPatientName(pat.getName());
                        }
                    }
                    sendResponse(exchange, "{\"prescriptions\":" + toJson(prescriptions) + ",\"count\":" + prescriptions.size() + "}");
                } else if (path.matches("/api/prescriptions/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    Prescription prescription = new PrescriptionService().getPrescriptionById(id);
                    if (prescription != null) {
                        sendResponse(exchange, toJson(prescription));
                    } else {
                        sendError(exchange, 404, "Prescription not found");
                    }
                } else if (path.matches("/api/prescriptions/\\d+/status") && "PUT".equals(method)) {
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile("/api/prescriptions/(\\d+)/status");
                    java.util.regex.Matcher m = p.matcher(path);
                    if (m.find()) {
                        int id = Integer.parseInt(m.group(1));
                        String body = getRequestBody(exchange);
                        Map<String, String> params = parseJson(body);
                        String status = params.get("status");
                        System.out.println("[DEBUG] Updating prescription " + id + " status to: " + status);
                        int result = new PrescriptionService().updatePrescriptionStatus(id, status);
                        sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                    } else {
                        sendError(exchange, 400, "Invalid path");
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
