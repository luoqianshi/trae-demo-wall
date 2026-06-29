package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Patient;
import bean.Doctor;
import bean.Drug;
import bean.Prescription;
import bean.PrescriptionItem;
import service.PrescriptionService;
import service.PrescriptionItemService;
import service.DoctorService;
import service.PatientService;
import service.DrugService;
import service.PharmacyDispenseService;
import java.util.List;
import java.util.Map;

public class PharmacyHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/pharmacy/pending".equals(path) && "GET".equals(method)) {
                    List<Prescription> prescriptions = new PrescriptionService().getPrescriptionsByStatus("paid");
                    PrescriptionItemService piService = new PrescriptionItemService();
                    DoctorService doctorService = new DoctorService();
                    PatientService patientService = new PatientService();
                    StringBuilder sb = new StringBuilder("{\"prescriptions\":[");
                    for (int pi = 0; pi < prescriptions.size(); pi++) {
                        if (pi > 0) sb.append(",");
                        Prescription p = prescriptions.get(pi);
                        String doctorName = "";
                        String patientName = "";
                        if (p.getDoctorId() > 0) {
                            Doctor doc = doctorService.getDoctorById(p.getDoctorId());
                            if (doc != null) doctorName = doc.getName();
                        }
                        if (p.getPatientId() > 0) {
                            Patient pat = patientService.getPatientById(p.getPatientId());
                            if (pat != null) patientName = pat.getName();
                        }
                        List<PrescriptionItem> pItems = piService.getPrescriptionItemsByPrescriptionId(p.getId());
                        DrugService drugSvc = new DrugService();
                        for (PrescriptionItem item : pItems) {
                            Drug drug = drugSvc.getDrugById(item.getDrugId());
                            if (drug != null) {
                                item.setDrugName(drug.getName());
                                item.setDrugSpec(drug.getSpec());
                            }
                        }
                        sb.append("{\"id\":").append(p.getId())
                          .append(",\"patientId\":").append(p.getPatientId())
                          .append(",\"patientName\":\"").append(escapeJson(patientName)).append("\"")
                          .append(",\"doctorId\":").append(p.getDoctorId())
                          .append(",\"doctorName\":\"").append(escapeJson(doctorName)).append("\"")
                          .append(",\"registrationId\":").append(p.getRegistrationId())
                          .append(",\"diagnosis\":").append(p.getDiagnosis() != null ? "\"" + escapeJson(p.getDiagnosis()) + "\"" : "null")
                          .append(",\"totalPrice\":").append(p.getTotalPrice())
                          .append(",\"createTime\":\"").append(p.getCreateTime()).append("\"")
                          .append(",\"status\":\"").append(escapeJson(p.getStatus())).append("\"")
                          .append(",\"items\":").append(toJson(pItems))
                          .append("}");
                    }
                    sb.append("],\"count\":").append(prescriptions.size()).append("}");
                    sendResponse(exchange, sb.toString());
                } else if ("/api/pharmacy/dispensed".equals(path) && "GET".equals(method)) {
                    List<Prescription> prescriptions = new PrescriptionService().getPrescriptionsByStatus("dispensed");
                    PrescriptionItemService piService = new PrescriptionItemService();
                    DoctorService doctorService = new DoctorService();
                    PatientService patientService = new PatientService();
                    StringBuilder sb = new StringBuilder("{\"prescriptions\":[");
                    for (int pi = 0; pi < prescriptions.size(); pi++) {
                        if (pi > 0) sb.append(",");
                        Prescription p = prescriptions.get(pi);
                        String doctorName = "";
                        String patientName = "";
                        try { doctorName = doctorService.getDoctorById(p.getDoctorId()).getName(); } catch (Exception ex) { ex.printStackTrace(); }
                        try { patientName = patientService.getPatientById(p.getPatientId()).getName(); } catch (Exception ex) { ex.printStackTrace(); }
                        List<PrescriptionItem> pItems = piService.getPrescriptionItemsByPrescriptionId(p.getId());
                        sb.append("{\"id\":").append(p.getId())
                          .append(",\"patientId\":").append(p.getPatientId())
                          .append(",\"patientName\":\"").append(escapeJson(patientName)).append("\"")
                          .append(",\"doctorId\":").append(p.getDoctorId())
                          .append(",\"doctorName\":\"").append(escapeJson(doctorName)).append("\"")
                          .append(",\"diagnosis\":\"").append(escapeJson(p.getDiagnosis() != null ? p.getDiagnosis() : "")).append("\"")
                          .append(",\"totalPrice\":").append(p.getTotalPrice())
                          .append(",\"status\":\"").append(p.getStatus()).append("\"")
                          .append(",\"createdAt\":\"").append(p.getCreateTime() != null ? p.getCreateTime() : "").append("\"")
                          .append(",\"dispenseTime\":\"").append(p.getCreateTime() != null ? p.getCreateTime() : "").append("\"")
                          .append(",\"items\":").append(toJson(pItems))
                          .append("}");
                    }
                    sb.append("],\"count\":").append(prescriptions.size()).append("}");
                    sendResponse(exchange, sb.toString());
                } else if ("/api/pharmacy/prepared".equals(path) && "GET".equals(method)) {
                    List<Prescription> prescriptions = new PrescriptionService().getPrescriptionsByStatus("prepared");
                    PrescriptionItemService piService = new PrescriptionItemService();
                    DoctorService doctorService = new DoctorService();
                    PatientService patientService = new PatientService();
                    StringBuilder sb = new StringBuilder("{\"prescriptions\":[");
                    for (int pi = 0; pi < prescriptions.size(); pi++) {
                        if (pi > 0) sb.append(",");
                        Prescription p = prescriptions.get(pi);
                        String doctorName = "";
                        String patientName = "";
                        try { doctorName = doctorService.getDoctorById(p.getDoctorId()).getName(); } catch (Exception ex) { ex.printStackTrace(); }
                        try { patientName = patientService.getPatientById(p.getPatientId()).getName(); } catch (Exception ex) { ex.printStackTrace(); }
                        List<PrescriptionItem> pItems = piService.getPrescriptionItemsByPrescriptionId(p.getId());
                        sb.append("{\"id\":").append(p.getId())
                          .append(",\"patientId\":").append(p.getPatientId())
                          .append(",\"patientName\":\"").append(escapeJson(patientName)).append("\"")
                          .append(",\"doctorId\":").append(p.getDoctorId())
                          .append(",\"doctorName\":\"").append(escapeJson(doctorName)).append("\"")
                          .append(",\"diagnosis\":\"").append(escapeJson(p.getDiagnosis() != null ? p.getDiagnosis() : "")).append("\"")
                          .append(",\"totalPrice\":").append(p.getTotalPrice())
                          .append(",\"status\":\"").append(p.getStatus()).append("\"")
                          .append(",\"createdAt\":\"").append(p.getCreateTime() != null ? p.getCreateTime() : "").append("\"")
                          .append(",\"items\":").append(toJson(pItems))
                          .append("}");
                    }
                    sb.append("],\"count\":").append(prescriptions.size()).append("}");
                    sendResponse(exchange, sb.toString());
                } else if ("/api/pharmacy/prescription".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    if (query != null && query.contains("prescriptionId=")) {
                        String idStr = query.substring(query.indexOf("prescriptionId=") + 15);
                        int prescriptionId = Integer.parseInt(idStr);
                        List<PrescriptionItem> items = new PrescriptionItemService().getPrescriptionItemsByPrescriptionId(prescriptionId);
                        DrugService drugSvc2 = new DrugService();
                        for (PrescriptionItem item : items) {
                            Drug drug = drugSvc2.getDrugById(item.getDrugId());
                            if (drug != null) {
                                item.setDrugName(drug.getName());
                                item.setDrugSpec(drug.getSpec());
                            }
                        }
                        sendResponse(exchange, "{\"items\":" + toJson(items) + ",\"count\":" + items.size() + "}");
                    } else {
                        sendError(exchange, 400, "Missing prescriptionId parameter");
                    }
                } else if ("/api/pharmacy/check-stock".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    int prescriptionId = Integer.parseInt(params.get("prescriptionId"));
                    List<PrescriptionItem> items = new PrescriptionItemService().getPrescriptionItemsByPrescriptionId(prescriptionId);
                    boolean canDispense = true;
                    java.util.List<String> insufficientDrugs = new java.util.ArrayList<>();
                    for (PrescriptionItem item : items) {
                        Drug drug = new DrugService().getDrugById(item.getDrugId());
                        if (drug == null || drug.getStock() < item.getNum()) {
                            canDispense = false;
                            String drugName = drug != null ? drug.getName() : "Drug ID: " + item.getDrugId();
                            insufficientDrugs.add(drugName + " (需要: " + item.getNum() + ", 库存: " + (drug != null ? drug.getStock() : 0) + ")");
                        }
                    }
                    StringBuilder sb = new StringBuilder();
                    sb.append("{\"success\":true,\"canDispense\":").append(canDispense);
                    if (!canDispense) {
                        sb.append(",\"insufficientDrugs\":[");
                        for (int i = 0; i < insufficientDrugs.size(); i++) {
                            if (i > 0) sb.append(",");
                            sb.append("\"").append(escapeJson(insufficientDrugs.get(i))).append("\"");
                        }
                        sb.append("]");
                    }
                    sb.append("}");
                    sendResponse(exchange, sb.toString());
                } else if ("/api/pharmacy/dispense".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    int prescriptionId = Integer.parseInt(params.get("prescriptionId"));
                    String operator = params.get("operator");
                    PharmacyDispenseService.DispenseResult result =
                        new PharmacyDispenseService().dispense(prescriptionId, operator);
                    if (!result.isSuccess()) {
                        StringBuilder sb = new StringBuilder();
                        sb.append("{\"success\":false,\"error\":\"").append(escapeJson(result.getMessage())).append("\"");
                        if (result.getInsufficientDrugs() != null && !result.getInsufficientDrugs().isEmpty()) {
                            sb.append(",\"insufficientDrugs\":").append(toJson(result.getInsufficientDrugs()));
                        }
                        sb.append("}");
                        sendResponse(exchange, sb.toString());
                        return;
                    }
                    sendResponse(exchange, "{\"success\":true,\"message\":\"" + escapeJson(result.getMessage()) + "\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
