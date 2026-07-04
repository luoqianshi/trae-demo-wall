package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Patient;
import service.AuditLogService;
import service.PatientService;
import service.PatientIdentityService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.Date;
import java.text.SimpleDateFormat;

public class PatientHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/patients".equals(path)) {
                    if ("GET".equals(method)) {
                        Map<String, String> queryParams = parseQuery(exchange.getRequestURI().getQuery());
                        String keyword = null;
                        int page = 1, size = 20;
                        keyword = queryParams.get("keyword");
                        if (queryParams.get("page") != null) page = Math.max(1, Integer.parseInt(queryParams.get("page")));
                        if (queryParams.get("size") != null) size = Math.max(1, Math.min(999999, Integer.parseInt(queryParams.get("size"))));
                        if (keyword != null && !keyword.isEmpty()) {
                            List<Patient> patients = new PatientService().searchPatients(keyword);
                            sendResponse(exchange, "{\"patients\":" + toJson(patients) + ",\"count\":" + patients.size() + "}");
                        } else {
                            List<Patient> allPatients = new PatientService().getAllPatients();
                            int total = allPatients.size();
                            int fromIndex = (page - 1) * size;
                            int toIndex = Math.min(fromIndex + size, total);
                            List<Patient> pageList = fromIndex < total ? allPatients.subList(fromIndex, toIndex) : new java.util.ArrayList<Patient>();
                            sendResponse(exchange, "{\"patients\":" + toJson(pageList) + ",\"total\":" + total + ",\"page\":" + page + ",\"size\":" + size + ",\"pages\":" + ((total + size - 1) / size) + "}");
                        }
                    } else if ("POST".equals(method)) {
                        String body = getRequestBody(exchange);
                        Map<String, String> params = parseJson(body);
                        Patient patient = new Patient();
                        String hospitalId = params.get("hospitalId") != null ? params.get("hospitalId") : params.get("hospital_id");
                        if (hospitalId == null || hospitalId.isEmpty()) {
                            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyyMMdd");
                            hospitalId = "H" + sdf.format(new java.util.Date()) + String.format("%06d", new java.util.Random().nextInt(1000000));
                        }
                        patient.setHospitalId(hospitalId);
                        if (params.get("name") != null) patient.setName(params.get("name"));
                        if (params.get("gender") != null) patient.setGender(params.get("gender"));
                        if (params.get("age") != null && !params.get("age").isEmpty()) patient.setAge(Integer.parseInt(params.get("age")));
                        if (params.get("phone") != null) patient.setPhone(params.get("phone"));
                        if (params.get("idCard") != null || params.get("id_card") != null) patient.setIdCard(params.get("idCard") != null ? params.get("idCard") : params.get("id_card"));
                        String medicalRecordNo = params.get("medicalRecordNo") != null ? params.get("medicalRecordNo") : params.get("medical_record_no");
                        if (medicalRecordNo == null || medicalRecordNo.isEmpty()) {
                            medicalRecordNo = "MR" + System.currentTimeMillis();
                        }
                        patient.setMedicalRecordNo(medicalRecordNo);
                        String outpatientNo = first(params, "outpatientNo", "outpatient_no");
                        if (outpatientNo != null) patient.setOutpatientNo(outpatientNo);
                        String inpatientNo = first(params, "inpatientNo", "inpatient_no");
                        if (inpatientNo != null) patient.setInpatientNo(inpatientNo);
                        if (params.get("birthDate") != null || params.get("birth_date") != null) {
                            try { patient.setBirthDate(java.sql.Date.valueOf(params.get("birthDate") != null ? params.get("birthDate") : params.get("birth_date"))); } catch (Exception e) { e.printStackTrace(); }
                        }
                        if (params.get("address") != null) patient.setAddress(params.get("address"));
                        if (params.get("occupation") != null) patient.setOccupation(params.get("occupation"));
                        String maritalStatus = first(params, "maritalStatus", "marital_status");
                        if (maritalStatus != null) patient.setMaritalStatus(maritalStatus);
                        String insuranceType = first(params, "insuranceType", "insurance_type");
                        if (insuranceType != null) patient.setInsuranceType(insuranceType);
                        String medicalInsuranceNo = first(params, "medicalInsuranceNo", "medical_insurance_no");
                        if (medicalInsuranceNo != null) patient.setMedicalInsuranceNo(medicalInsuranceNo);
                        String contractUnit = first(params, "contractUnit", "contract_unit");
                        if (contractUnit != null) patient.setContractUnit(contractUnit);
                        String insuranceSelfRatio = first(params, "insuranceSelfRatio", "insurance_self_ratio");
                        if (insuranceSelfRatio != null && !insuranceSelfRatio.isEmpty()) {
                            try { patient.setInsuranceSelfRatio(new java.math.BigDecimal(insuranceSelfRatio)); } catch (Exception e) { e.printStackTrace(); }
                        }
                        String emergencyContact = first(params, "emergencyContact", "emergency_contact");
                        if (emergencyContact != null) patient.setEmergencyContact(emergencyContact);
                        String emergencyPhone = first(params, "emergencyPhone", "emergency_phone");
                        if (emergencyPhone != null) patient.setEmergencyPhone(emergencyPhone);
                        String allergyHistory = first(params, "allergyHistory", "allergy_history");
                        if (allergyHistory != null) patient.setAllergyHistory(allergyHistory);
                        String drugAdverseHistory = first(params, "drugAdverseHistory", "drug_adverse_history");
                        if (drugAdverseHistory != null) patient.setDrugAdverseHistory(drugAdverseHistory);
                        String infectiousDiseaseHistory = first(params, "infectiousDiseaseHistory", "infectious_disease_history");
                        if (infectiousDiseaseHistory != null) patient.setInfectiousDiseaseHistory(infectiousDiseaseHistory);
                        String specialDiseaseFlag = first(params, "specialDiseaseFlag", "special_disease_flag");
                        if (specialDiseaseFlag != null && !specialDiseaseFlag.isEmpty()) {
                            try { patient.setSpecialDiseaseFlag(Integer.parseInt(specialDiseaseFlag)); } catch (Exception e) { e.printStackTrace(); }
                        }
                        PatientService patientService = new PatientService();
                        if (!"true".equalsIgnoreCase(params.get("forceDuplicate")) && patient.getIdCard() != null && !patient.getIdCard().trim().isEmpty()) {
                            Patient exists = patientService.findByIdCard(patient.getIdCard().trim());
                            if (exists != null) {
                                sendResponse(exchange, "{\"success\":false,\"code\":\"DUPLICATE_PATIENT\",\"message\":\"身份证号已存在，请直接选择已有患者\",\"duplicates\":[" + toJson(exists) + "]}");
                                return;
                            }
                        }
                        int result = patientService.addPatient(patient);
                        if (result > 0) {
                            patient.setId(result);
                            new PatientIdentityService().syncFromPatient(patient);
                            new AuditLogService().record(
                                "patient_create",
                                "patient",
                                (long) result,
                                (long) result,
                                "患者主索引",
                                params.get("operator"),
                                String.valueOf(exchange.getRemoteAddress()),
                                true,
                                "新建患者档案: " + patient.getName()
                            );
                        }
                        sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + ",\"hospitalId\":\"" + escapeJson(hospitalId) + "\",\"medicalRecordNo\":\"" + escapeJson(medicalRecordNo) + "\"}");
                    }
                } else if (path.matches("/api/patients/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    PatientService patientService = new PatientService();
                    Patient existing = patientService.getPatientById(id);
                    if (existing == null) { sendResponse(exchange, "{\"success\":false,\"error\":\"not found\"}"); return; }
                    if (params.get("hospitalId") != null || params.get("hospital_id") != null) existing.setHospitalId(params.get("hospitalId") != null ? params.get("hospitalId") : params.get("hospital_id"));
                    if (params.get("name") != null) existing.setName(params.get("name"));
                    if (params.get("gender") != null) existing.setGender(params.get("gender"));
                    if (params.get("age") != null && !params.get("age").isEmpty()) existing.setAge(Integer.parseInt(params.get("age")));
                    if (params.get("phone") != null) existing.setPhone(params.get("phone"));
                    if (params.get("idCard") != null || params.get("id_card") != null) existing.setIdCard(params.get("idCard") != null ? params.get("idCard") : params.get("id_card"));
                    if (params.get("medicalRecordNo") != null || params.get("medical_record_no") != null) existing.setMedicalRecordNo(params.get("medicalRecordNo") != null ? params.get("medicalRecordNo") : params.get("medical_record_no"));
                    String outpatientNo = first(params, "outpatientNo", "outpatient_no");
                    if (outpatientNo != null) existing.setOutpatientNo(outpatientNo);
                    String inpatientNo = first(params, "inpatientNo", "inpatient_no");
                    if (inpatientNo != null) existing.setInpatientNo(inpatientNo);
                    if (params.get("birthDate") != null || params.get("birth_date") != null) {
                        try { existing.setBirthDate(java.sql.Date.valueOf(params.get("birthDate") != null ? params.get("birthDate") : params.get("birth_date"))); } catch (Exception e) { e.printStackTrace(); }
                    }
                    if (params.get("address") != null) existing.setAddress(params.get("address"));
                    if (params.get("occupation") != null) existing.setOccupation(params.get("occupation"));
                    String maritalStatus = first(params, "maritalStatus", "marital_status");
                    if (maritalStatus != null) existing.setMaritalStatus(maritalStatus);
                    String insuranceType = first(params, "insuranceType", "insurance_type");
                    if (insuranceType != null) existing.setInsuranceType(insuranceType);
                    String medicalInsuranceNo = first(params, "medicalInsuranceNo", "medical_insurance_no");
                    if (medicalInsuranceNo != null) existing.setMedicalInsuranceNo(medicalInsuranceNo);
                    String contractUnit = first(params, "contractUnit", "contract_unit");
                    if (contractUnit != null) existing.setContractUnit(contractUnit);
                    String insuranceSelfRatio = first(params, "insuranceSelfRatio", "insurance_self_ratio");
                    if (insuranceSelfRatio != null && !insuranceSelfRatio.isEmpty()) {
                        try { existing.setInsuranceSelfRatio(new java.math.BigDecimal(insuranceSelfRatio)); } catch (Exception e) { e.printStackTrace(); }
                    }
                    String emergencyContact = first(params, "emergencyContact", "emergency_contact");
                    if (emergencyContact != null) existing.setEmergencyContact(emergencyContact);
                    String emergencyPhone = first(params, "emergencyPhone", "emergency_phone");
                    if (emergencyPhone != null) existing.setEmergencyPhone(emergencyPhone);
                    String allergyHistory = first(params, "allergyHistory", "allergy_history");
                    if (allergyHistory != null) existing.setAllergyHistory(allergyHistory);
                    String drugAdverseHistory = first(params, "drugAdverseHistory", "drug_adverse_history");
                    if (drugAdverseHistory != null) existing.setDrugAdverseHistory(drugAdverseHistory);
                    String infectiousDiseaseHistory = first(params, "infectiousDiseaseHistory", "infectious_disease_history");
                    if (infectiousDiseaseHistory != null) existing.setInfectiousDiseaseHistory(infectiousDiseaseHistory);
                    String specialDiseaseFlag = first(params, "specialDiseaseFlag", "special_disease_flag");
                    if (specialDiseaseFlag != null && !specialDiseaseFlag.isEmpty()) {
                        try { existing.setSpecialDiseaseFlag(Integer.parseInt(specialDiseaseFlag)); } catch (Exception e) { e.printStackTrace(); }
                    }
                    if (!"true".equalsIgnoreCase(params.get("forceDuplicate")) && existing.getIdCard() != null && !existing.getIdCard().trim().isEmpty()) {
                        List<Map<String, Object>> duplicates = new PatientIdentityService().findDuplicates(existing.getIdCard(), null, null, null, (long) id);
                        if (!duplicates.isEmpty()) {
                            sendResponse(exchange, "{\"success\":false,\"code\":\"DUPLICATE_PATIENT\",\"message\":\"身份证号已存在，请直接选择已有患者\",\"duplicates\":" + toJson(duplicates) + "}");
                            return;
                        }
                    }
                    int result = patientService.updatePatient(existing);
                    if (result > 0) {
                        new PatientIdentityService().syncFromPatient(existing);
                        new AuditLogService().record(
                            "patient_update",
                            "patient",
                            (long) id,
                            (long) id,
                            "患者主索引",
                            params.get("operator"),
                            String.valueOf(exchange.getRemoteAddress()),
                            true,
                            "更新患者档案: " + existing.getName()
                        );
                    }
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/patients/\\d+") && "DELETE".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    System.out.println("[PatientHandler] DELETE patient id=" + id);
                    try {
                        Patient patient = new PatientService().getPatientById(id);
                        new PatientService().deletePatient(id);
                        new AuditLogService().record(
                            "patient_delete",
                            "patient",
                            (long) id,
                            (long) id,
                            "患者主索引",
                            null,
                            String.valueOf(exchange.getRemoteAddress()),
                            true,
                            "删除患者档案: " + (patient != null ? patient.getName() : id)
                        );
                        sendResponse(exchange, "{\"success\":true}");
                    } catch (Exception delEx) {
                        System.err.println("[PatientHandler] DELETE failed: " + delEx.getMessage());
                        sendResponse(exchange, "{\"success\":false,\"error\":\"" + escapeJson(delEx.getMessage()) + "\"}");
                    }
                } else if (path.matches("/api/patients/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    Patient patient = new PatientService().getPatientById(id);
                    if (patient != null) {
                        sendResponse(exchange, toJson(patient));
                    } else {
                        sendError(exchange, 404, "Patient not found");
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }

        private String first(Map<String, String> params, String... keys) {
            for (String key : keys) {
                String value = params.get(key);
                if (value != null) return value;
            }
            return null;
        }
}
