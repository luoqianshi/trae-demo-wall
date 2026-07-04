package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.PhysicalExam;
import bean.MedicalRecord;
import bean.MedicalRecordVersion;
import service.MedicalRecordService;
import service.MedicalRecordVersionService;
import java.util.List;
import java.util.Map;
import java.util.Date;

public class MedicalRecordHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/medical-records".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    MedicalRecord record = new MedicalRecord();
                    if (params.get("patientId") != null && !params.get("patientId").isEmpty()) {
                        record.setPatientId(Integer.parseInt(params.get("patientId")));
                    }
                    if (params.get("registrationId") != null && !params.get("registrationId").isEmpty()) {
                        record.setRegistrationId(Integer.parseInt(params.get("registrationId")));
                    }
                    if (params.get("chiefComplaint") != null) record.setChiefComplaint(params.get("chiefComplaint"));
                    if (params.get("diagnosis") != null) record.setDiagnosis(params.get("diagnosis"));
                    if (params.get("treatment") != null) record.setTreatment(params.get("treatment"));
                    int result = new MedicalRecordService().addRecord(record);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if ("/api/medical-records".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<MedicalRecord> records;
                    if (query != null && query.contains("patientId=")) {
                        String patientIdStr = query.substring(query.indexOf("patientId=") + 10);
                        try {
                            patientIdStr = java.net.URLDecoder.decode(patientIdStr, "UTF-8");
                            int patientId = Integer.parseInt(patientIdStr);
                            records = new MedicalRecordService().getRecordsByPatientId(patientId);
                        } catch (Exception e) {
                            records = new MedicalRecordService().getAllRecords();
                        }
                    } else {
                        records = new MedicalRecordService().getAllRecords();
                    }
                    sendResponse(exchange, "{\"medicalRecords\":" + toJson(records) + ",\"count\":" + records.size() + "}");
                } else if (path.matches("/api/medical-records/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    
                    MedicalRecordService recordService = new MedicalRecordService();
                    MedicalRecord existingRecord = recordService.getRecordById(id);
                    if (existingRecord == null) {
                        sendError(exchange, 404, "Medical record not found");
                        return;
                    }
                    
                    String versionContent = String.format(
                        "{\"chiefComplaint\":\"%s\",\"presentIllness\":\"%s\",\"pastHistory\":\"%s\"," +
                        "\"physicalExam\":\"%s\",\"diagnosis\":\"%s\",\"treatmentPlan\":\"%s\"}",
                        escapeJson(existingRecord.getChiefComplaint() != null ? existingRecord.getChiefComplaint() : ""),
                        escapeJson(existingRecord.getPresentIllness() != null ? existingRecord.getPresentIllness() : ""),
                        escapeJson(existingRecord.getPastHistory() != null ? existingRecord.getPastHistory() : ""),
                        escapeJson(existingRecord.getPhysicalExam() != null ? existingRecord.getPhysicalExam() : ""),
                        escapeJson(existingRecord.getDiagnosis() != null ? existingRecord.getDiagnosis() : ""),
                        escapeJson(existingRecord.getTreatmentPlan() != null ? existingRecord.getTreatmentPlan() : "")
                    );
                    
                    MedicalRecordVersion version = new MedicalRecordVersion();
                    version.setRecordId(id);
                    version.setContent(versionContent);
                    if (params.get("operatorId") != null && !params.get("operatorId").isEmpty()) {
                        version.setOperatorId(Integer.parseInt(params.get("operatorId")));
                    }
                    new MedicalRecordVersionService().addMedicalRecordVersion(version);
                    
                    MedicalRecord record = new MedicalRecord();
                    record.setId(id);
                    record.setPatientId(existingRecord.getPatientId());
                    record.setDoctorId(existingRecord.getDoctorId());
                    record.setRegistrationId(existingRecord.getRegistrationId());
                    record.setCreateTime(existingRecord.getCreateTime());
                    
                    if (params.get("chiefComplaint") != null) record.setChiefComplaint(params.get("chiefComplaint"));
                    else record.setChiefComplaint(existingRecord.getChiefComplaint());
                    if (params.get("presentIllness") != null) record.setPresentIllness(params.get("presentIllness"));
                    else record.setPresentIllness(existingRecord.getPresentIllness());
                    if (params.get("pastHistory") != null) record.setPastHistory(params.get("pastHistory"));
                    else record.setPastHistory(existingRecord.getPastHistory());
                    if (params.get("physicalExam") != null) record.setPhysicalExam(params.get("physicalExam"));
                    else record.setPhysicalExam(existingRecord.getPhysicalExam());
                    if (params.get("diagnosis") != null) record.setDiagnosis(params.get("diagnosis"));
                    else record.setDiagnosis(existingRecord.getDiagnosis());
                    if (params.get("treatmentPlan") != null) record.setTreatmentPlan(params.get("treatmentPlan"));
                    else record.setTreatmentPlan(existingRecord.getTreatmentPlan());
                    
                    record.setUpdateTime(new java.util.Date());
                    int result = recordService.updateRecord(record);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/medical-records/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    MedicalRecord record = new MedicalRecordService().getRecordById(id);
                    if (record != null) {
                        sendResponse(exchange, toJson(record));
                    } else {
                        sendError(exchange, 404, "Medical record not found");
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
