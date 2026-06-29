package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Patient;
import bean.Doctor;
import bean.Bed;
import bean.MedicalRecordArchive;
import bean.Inpatient;
import service.InpatientService;
import service.PatientService;
import service.BedService;
import service.DoctorService;
import service.MedicalRecordArchiveService;
import java.util.List;
import java.util.Map;
import java.util.Date;
import java.text.SimpleDateFormat;

public class InpatientHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                InpatientService service = new InpatientService();

                if ("/api/inpatients".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<Inpatient> list;
                    if (query != null && query.contains("patientId=")) {
                        int patientId = Integer.parseInt(query.substring(query.indexOf("patientId=") + 10).split("&")[0]);
                        list = service.getByPatientId(patientId);
                    } else if (query != null && query.contains("dept=")) {
                        String dept = query.substring(query.indexOf("dept=") + 5);
                        list = service.getByDept(java.net.URLDecoder.decode(dept, "UTF-8"));
                    } else if (query != null && query.contains("status=")) {
                        String status = query.substring(query.indexOf("status=") + 7);
                        list = service.getByStatus(java.net.URLDecoder.decode(status, "UTF-8"));
                    } else {
                        list = service.getAll();
                    }
                    sendResponse(exchange, "{\"items\":" + toJson(list) + ",\"count\":" + list.size() + "}");
                } else if ("/api/inpatients".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Inpatient inpatient = new Inpatient();
                    int patientId = getIntParam(params, "patientId");
                    inpatient.setPatientId(patientId);
                    String inpatientNo = params.get("inpatientNo");
                    if (inpatientNo == null || inpatientNo.isEmpty()) {
                        Patient p = new PatientService().getPatientById(patientId);
                        inpatientNo = (p != null && p.getHospitalId() != null && !p.getHospitalId().isEmpty()) ? p.getHospitalId() : "IP" + System.currentTimeMillis();
                    }
                    inpatient.setInpatientNo(inpatientNo);
                    inpatient.setBedId(getIntParam(params, "bedId"));
                    inpatient.setBedNo(params.get("bedNo") != null ? params.get("bedNo") : "");
                    inpatient.setDept(params.get("dept") != null ? params.get("dept") : "");
                    inpatient.setDoctorId(getIntParam(params, "doctorId"));
                    inpatient.setStatus(params.get("status") != null ? params.get("status") : "admitted");
                    inpatient.setDiagnosis(params.get("diagnosis") != null ? params.get("diagnosis") : "");
                    if (params.get("gender") != null) inpatient.setGender(params.get("gender"));
                    if (params.get("age") != null && !params.get("age").isEmpty()) inpatient.setAge(Integer.parseInt(params.get("age")));
                    inpatient.setDeposit(getDecimalParam(params, "deposit"));
                    if (params.get("admissionDate") != null && !params.get("admissionDate").isEmpty()) {
                        try {
                            inpatient.setAdmissionDate(new java.text.SimpleDateFormat("yyyy-MM-dd").parse(params.get("admissionDate")));
                        } catch (Exception e) {
                            inpatient.setAdmissionDate(new java.util.Date());
                        }
                    } else {
                        inpatient.setAdmissionDate(new java.util.Date());
                    }
                    if (inpatient.getBedId() <= 0 && inpatient.getBedNo() != null && !inpatient.getBedNo().isEmpty()) {
                        try {
                            BedService bedSvc = new BedService();
                            List<Bed> beds = bedSvc.getAll();
                            for (Bed b : beds) {
                                if (b.getBedNo() != null && b.getBedNo().equals(inpatient.getBedNo())) {
                                    inpatient.setBedId(b.getId());
                                    break;
                                }
                            }
                        } catch (Exception e) { System.err.println("Lookup bed by bedNo failed: " + e.getMessage()); }
                    }
                    if (inpatient.getPatientName() == null || inpatient.getPatientName().isEmpty()) {
                        Patient p = new PatientService().getPatientById(inpatient.getPatientId());
                        if (p != null) inpatient.setPatientName(p.getName());
                    }
                    if ((inpatient.getDoctorName() == null || inpatient.getDoctorName().isEmpty()) && inpatient.getDoctorId() > 0) {
                        Doctor d = new DoctorService().getDoctorById(inpatient.getDoctorId());
                        if (d != null) inpatient.setDoctorName(d.getName());
                    }
                    int result = service.add(inpatient);
                    if (result > 0 && inpatient.getBedId() > 0) {
                        new BedService().allocate(inpatient.getBedId(), inpatient.getPatientId(), inpatient.getPatientName());
                    }
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + ",\"inpatientNo\":\"" + escapeJson(inpatient.getInpatientNo()) + "\"}");
                } else if (path.matches("/api/inpatients/\\d+") && "PUT".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Inpatient inpatient = service.getById(id);
                    if (inpatient == null) {
                        sendError(exchange, 404, "Inpatient not found");
                        return;
                    }
                    if (params.get("patientId") != null) inpatient.setPatientId(getIntParam(params, "patientId"));
                    if (params.get("patientName") != null) inpatient.setPatientName(params.get("patientName"));
                    if (params.get("bedId") != null) inpatient.setBedId(getIntParam(params, "bedId"));
                    if (params.get("bedNo") != null) inpatient.setBedNo(params.get("bedNo"));
                    if (params.get("dept") != null) inpatient.setDept(params.get("dept"));
                    if (params.get("doctorId") != null) inpatient.setDoctorId(getIntParam(params, "doctorId"));
                    if (params.get("doctorName") != null) inpatient.setDoctorName(params.get("doctorName"));
                    if (params.get("status") != null) inpatient.setStatus(params.get("status"));
                    if (params.get("diagnosis") != null) inpatient.setDiagnosis(params.get("diagnosis"));
                    if (params.get("gender") != null) inpatient.setGender(params.get("gender"));
                    if (params.get("age") != null && !params.get("age").isEmpty()) inpatient.setAge(Integer.parseInt(params.get("age")));
                    if (params.get("totalFee") != null) inpatient.setTotalFee(getDecimalParam(params, "totalFee"));
                    if (params.get("deposit") != null) inpatient.setDeposit(getDecimalParam(params, "deposit"));
                    if (params.get("remark") != null) inpatient.setRemark(params.get("remark"));
                    if (params.get("admissionDate") != null && !params.get("admissionDate").isEmpty()) {
                        try { inpatient.setAdmissionDate(new java.text.SimpleDateFormat("yyyy-MM-dd").parse(params.get("admissionDate"))); } catch (Exception e) { e.printStackTrace(); }
                    }
                    if (params.get("dischargeDate") != null && !params.get("dischargeDate").isEmpty()) {
                        try { inpatient.setDischargeDate(new java.text.SimpleDateFormat("yyyy-MM-dd").parse(params.get("dischargeDate"))); } catch (Exception e) { e.printStackTrace(); }
                    }
                    int result = service.update(inpatient);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/inpatients/settlement/\\d+") && "GET".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    java.util.Map<String, Object> settlement = service.calculateSettlement(id);
                    if (settlement == null) {
                        sendError(exchange, 404, "Inpatient not found");
                        return;
                    }
                    StringBuilder sb = new StringBuilder("{");
                    sb.append("\"inpatientId\":").append(settlement.get("inpatientId")).append(",");
                    Object pn = settlement.get("patientName");
                    sb.append("\"patientName\":").append(pn != null ? "\"" + escapeJson(String.valueOf(pn)) + "\"" : "null").append(",");
                    Object ad = settlement.get("admissionDate");
                    sb.append("\"admissionDate\":").append(ad != null ? "\"" + escapeJson(String.valueOf(ad)) + "\"" : "null").append(",");
                    sb.append("\"details\":[");
                    java.util.List<java.util.Map<String, Object>> details = (java.util.List<java.util.Map<String, Object>>) settlement.get("details");
                    if (details != null) {
                        for (int i = 0; i < details.size(); i++) {
                            java.util.Map<String, Object> d = details.get(i);
                            if (i > 0) sb.append(",");
                            Object dn = d.get("name");
                            sb.append("{\"name\":").append(dn != null ? "\"" + escapeJson(String.valueOf(dn)) + "\"" : "null").append(",\"amount\":").append(d.get("amount")).append("}");
                        }
                    }
                    sb.append("],");
                    sb.append("\"totalFee\":").append(settlement.get("totalFee")).append(",");
                    sb.append("\"deposit\":").append(settlement.get("deposit")).append(",");
                    sb.append("\"balance\":").append(settlement.get("balance"));
                    sb.append("}");
                    sendResponse(exchange, sb.toString());
                } else if (path.matches("/api/inpatients/discharge/\\d+") && "POST".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    String diagnosis = params.get("diagnosis") != null ? params.get("diagnosis") : "";
                    Inpatient inpatient = service.getById(id);
                    int result = service.discharge(id, diagnosis);
                    if (result > 0 && inpatient != null && inpatient.getBedId() > 0) {
                        new BedService().vacate(inpatient.getBedId());
                    }
                    if (result > 0 && inpatient != null) {
                        try {
                            MedicalRecordArchiveService archiveService = new MedicalRecordArchiveService();
                            MedicalRecordArchive archive = new MedicalRecordArchive();
                            archive.setPatientId(inpatient.getPatientId());
                            archive.setPatientName(inpatient.getPatientName());
                            archive.setMedicalRecordId(0);
                            archive.setRecordId(0);
                            archive.setIcdCode("");
                            archive.setIcdName(diagnosis);
                            archive.setQualityScore(0);
                            archive.setArchiveStatus("pending");
                            archive.setArchivist(inpatient.getDoctorName() != null ? inpatient.getDoctorName() : "");
                            archive.setArchiveDate(new java.util.Date());
                            archive.setRemark("住院出院自动生成" + (diagnosis.isEmpty() ? "" : ": " + diagnosis));
                            archiveService.add(archive);
                        } catch (Exception ae) {
                            System.err.println("Auto archive on discharge failed: " + ae.getMessage());
                        }
                    }
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/inpatients/\\d+") && "GET".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    Inpatient inpatient = service.getById(id);
                    if (inpatient == null) {
                        sendError(exchange, 404, "Inpatient not found");
                        return;
                    }
                    sendResponse(exchange, toJson(inpatient));
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
