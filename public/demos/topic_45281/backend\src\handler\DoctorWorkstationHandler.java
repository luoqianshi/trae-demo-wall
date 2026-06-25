package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Patient;
import bean.Doctor;
import bean.Drug;
import bean.Charge;
import bean.Registration;
import bean.Prescription;
import bean.PhysicalExam;
import bean.PrescriptionItem;
import bean.QueueCall;
import bean.MedicalRecord;
import service.QueueCallService;
import service.RegistrationService;
import service.PatientService;
import service.PrescriptionService;
import service.ChargeService;
import service.MedicalRecordService;
import service.DrugService;
import service.PrescriptionItemService;
import service.PrescriptionWarningService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Date;
import java.util.Arrays;
import java.math.BigDecimal;
import java.util.stream.Collectors;

public class DoctorWorkstationHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if (path.matches("/api/doctor-workstation/queue/doctor/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int doctorId = Integer.parseInt(idStr);
                    List<QueueCall> queueCalls = new QueueCallService().getQueueCallsByDoctorId(doctorId);
                    List<Map<String, Object>> result = queueCalls.stream().map(qc -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", qc.getId());
                        map.put("registrationId", qc.getRegistrationId());
                        map.put("queueNo", qc.getQueueNo());
                        map.put("callStatus", qc.getCallStatus());
                        map.put("callTime", qc.getCallTime());
                        Registration reg = new RegistrationService().getRegistrationById(qc.getRegistrationId());
                        if (reg != null) {
                            map.put("patientId", reg.getPatientId());
                            map.put("regStatus", reg.getRegStatus());
                            Patient patient = new PatientService().getPatientById(reg.getPatientId());
                            if (patient != null) {
                                map.put("patientName", patient.getName());
                                map.put("patientGender", patient.getGender());
                                map.put("patientAge", patient.getAge());
                            }
                        }
                        return map;
                    }).collect(Collectors.toList());
                    sendResponse(exchange, "{\"queueCalls\":" + toJson(result) + ",\"count\":" + result.size() + "}");
                } else if (path.matches("/api/doctor-workstation/queue/call/\\d+") && "POST".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int queueId = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    String operator = params.get("operator");
                    QueueCall queueCall = new QueueCall();
                    queueCall.setId(queueId);
                    queueCall.setCallStatus("calling");
                    queueCall.setOperator(operator);
                    int result = new QueueCallService().updateQueueCall(queueCall);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/doctor-workstation/queue/finish/\\d+") && "POST".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int queueId = Integer.parseInt(idStr);
                    QueueCall queueCall = new QueueCallService().getQueueCallById(queueId);
                    if (queueCall != null) {
                        queueCall.setCallStatus("finished");
                        new QueueCallService().updateQueueCall(queueCall);
                        Registration registration = new RegistrationService().getRegistrationById(queueCall.getRegistrationId());
                        if (registration != null) {
                            registration.setRegStatus("finished");
                            new RegistrationService().updateRegistration(registration);
                        }
                    }
                    sendResponse(exchange, "{\"success\":true}");
                } else if (path.matches("/api/doctor-workstation/queue/miss/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int queueId = Integer.parseInt(idStr);
                    QueueCall queueCall = new QueueCallService().getQueueCallById(queueId);
                    if (queueCall != null) {
                        queueCall.setCallStatus("passed");
                        new QueueCallService().updateQueueCall(queueCall);
                        Registration registration = new RegistrationService().getRegistrationById(queueCall.getRegistrationId());
                        if (registration != null) {
                            registration.setRegStatus("passed");
                            new RegistrationService().updateRegistration(registration);
                        }
                    }
                    sendResponse(exchange, "{\"success\":true}");
                } else if (path.matches("/api/doctor-workstation/prescription/void/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int prescriptionId = Integer.parseInt(idStr);
                    System.out.println("[DEBUG] voidPrescription received params:");
                    System.out.println("  id = " + idStr);
                    System.out.println("  prescriptionId = " + prescriptionId);
                    PrescriptionService prescriptionService = new PrescriptionService();
                    Prescription prescription = prescriptionService.getPrescriptionById(prescriptionId);
                    System.out.println("[DEBUG] prescription found: " + (prescription != null));
                    if (prescription != null) {
                        prescription.setStatus("voided");
                        int result = prescriptionService.updatePrescription(prescription);
                        System.out.println("[DEBUG] updatePrescription result = " + result);
                        List<Charge> charges = new ChargeService().getChargesByPrescriptionId(prescriptionId);
                        System.out.println("[DEBUG] total charges = " + charges.size());
                        for (Charge charge : charges) {
                            if (!"refunded".equals(charge.getStatus())) {
                                charge.setStatus("voided");
                                new ChargeService().updateCharge(charge);
                            }
                        }
                        sendResponse(exchange, "{\"success\":true}");
                    } else {
                        sendError(exchange, 404, "Prescription not found");
                    }
                } else if ("/api/doctor-workstation/full-diagnosis".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    System.out.println("[full-diagnosis] POST body: " + body);
                    Map<String, Object> params = parseJsonToMap(body);

                    int patientId = params.get("patientId") != null ? Integer.parseInt(params.get("patientId").toString()) : 0;
                    int doctorId = params.get("doctorId") != null ? Integer.parseInt(params.get("doctorId").toString()) : 0;
                    int registrationId = params.get("registrationId") != null ? Integer.parseInt(params.get("registrationId").toString()) : 0;
                    System.out.println("[full-diagnosis] patientId=" + patientId + ", doctorId=" + doctorId + ", registrationId=" + registrationId);

                    Map<String, Object> medicalRecordMap = params.get("medicalRecord") instanceof Map ? (Map<String, Object>) params.get("medicalRecord") : new HashMap<>();
                    Map<String, Object> prescriptionMap = params.get("prescription") instanceof Map ? (Map<String, Object>) params.get("prescription") : new HashMap<>();

                    String chiefComplaint = medicalRecordMap.get("chiefComplaint") != null ? medicalRecordMap.get("chiefComplaint").toString() : "";
                    String diagnosis = medicalRecordMap.get("diagnosis") != null ? medicalRecordMap.get("diagnosis").toString() : "";
                    String presentIllness = medicalRecordMap.get("presentIllness") != null ? medicalRecordMap.get("presentIllness").toString() : "";
                    String pastHistory = medicalRecordMap.get("pastHistory") != null ? medicalRecordMap.get("pastHistory").toString() : "";
                    String physicalExam = medicalRecordMap.get("physicalExam") != null ? medicalRecordMap.get("physicalExam").toString() : "";
                    String treatmentPlan = medicalRecordMap.get("treatmentPlan") != null ? medicalRecordMap.get("treatmentPlan").toString() : "";

                    java.util.List<Map<String, Object>> itemsList = prescriptionMap.get("items") instanceof java.util.List ? (java.util.List<Map<String, Object>>) prescriptionMap.get("items") : new java.util.ArrayList<>();
                    System.out.println("[full-diagnosis] itemsList size: " + itemsList.size());

                    Registration registration = new Registration();
                    registration.setPatientId(patientId);
                    registration.setDoctorId(doctorId);
                    registration.setRegFee(new java.math.BigDecimal("10"));
                    registration.setRegStatus("treating");
                    int regId;
                    if (registrationId > 0) {
                        registration.setId(registrationId);
                        new RegistrationService().updateRegistration(registration);
                        regId = registrationId;
                    } else {
                        regId = new RegistrationService().register(registration);
                    }
                    
                    MedicalRecord record = new MedicalRecord();
                    record.setPatientId(patientId);
                    record.setDoctorId(doctorId);
                    record.setRegistrationId(regId);
                    record.setChiefComplaint(chiefComplaint);
                    record.setPresentIllness(presentIllness);
                    record.setPastHistory(pastHistory);
                    record.setPhysicalExam(physicalExam);
                    record.setDiagnosis(diagnosis);
                    record.setTreatmentPlan(treatmentPlan);
                    int mrId = new MedicalRecordService().addRecord(record);
                    
                    double totalPrice = 0;
                    StringBuilder itemsStr = new StringBuilder();
                    java.util.List<PrescriptionItem> prescriptionItems = new java.util.ArrayList<>();
                    
                    for (Map<String, Object> item : itemsList) {
                        int drugId = item.get("drugId") != null ? Integer.parseInt(item.get("drugId").toString()) : 0;
                        int num = item.get("num") != null ? Integer.parseInt(item.get("num").toString()) : 1;
                        
                        Drug drug = new DrugService().getDrugById(drugId);
                        double itemPrice = drug != null ? drug.getPrice().doubleValue() : 0;
                        totalPrice += itemPrice * num;
                        
                        if (itemsStr.length() > 0) itemsStr.append("|");
                        itemsStr.append(drugId).append(",").append(num).append(",").append(itemPrice);
                        
                        PrescriptionItem pi = new PrescriptionItem();
                        pi.setDrugId(drugId);
                        pi.setNum(num);
                        pi.setDrugPrice(new java.math.BigDecimal(itemPrice));
                        prescriptionItems.add(pi);
                    }
                    
                    Prescription prescription = new Prescription();
                    prescription.setPatientId(patientId);
                    prescription.setDoctorId(doctorId);
                    prescription.setRegistrationId(regId);
                    prescription.setDiagnosis(diagnosis);
                    prescription.setItems(itemsStr.toString());
                    prescription.setTotalPrice(new java.math.BigDecimal(totalPrice));
                    prescription.setStatus("pending");
                    int preId = new PrescriptionService().addPrescription(prescription);
                    
                    for (PrescriptionItem pi : prescriptionItems) {
                        pi.setPrescriptionId(preId);
                        new PrescriptionItemService().addPrescriptionItem(pi);
                    }
                    
                    sendResponse(exchange, "{\"success\":true,\"registrationId\":" + regId + ",\"medicalRecordId\":" + mrId + ",\"prescriptionId\":" + preId + "}");
                } else if (path.matches("/api/doctor-workstation/patient/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int patientId = Integer.parseInt(idStr);
                    Patient patient = new PatientService().getPatientById(patientId);
                    if (patient != null) {
                        sendResponse(exchange, toJson(patient));
                    } else {
                        sendError(exchange, 404, "Patient not found");
                    }
                } else if (path.matches("/api/doctor-workstation/queue/status/[^/]+") && "GET".equals(method)) {
                    String status = path.substring(path.lastIndexOf('/') + 1);
                    List<QueueCall> queueCalls = new QueueCallService().getQueueCallsByCallStatus(status);
                    sendResponse(exchange, "{\"queueCalls\":" + toJson(queueCalls) + ",\"count\":" + queueCalls.size() + "}");
                } else if (path.matches("/api/doctor-workstation/registrations/doctor/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int doctorId = Integer.parseInt(idStr);
                    List<Registration> registrations = new RegistrationService().getRegistrationsByDoctorId(doctorId);
                    sendResponse(exchange, "{\"registrations\":" + toJson(registrations) + ",\"count\":" + registrations.size() + "}");
                } else if (path.matches("/api/doctor-workstation/prescriptions/patient/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int patientId = Integer.parseInt(idStr);
                    List<Prescription> prescriptions = new PrescriptionService().getPrescriptionsByPatientId(patientId);
                    sendResponse(exchange, "{\"prescriptions\":" + toJson(prescriptions) + ",\"count\":" + prescriptions.size() + "}");
                } else if (path.matches("/api/doctor-workstation/prescriptions/doctor/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int doctorId = Integer.parseInt(idStr);
                    List<Prescription> prescriptions = new PrescriptionService().getPrescriptionsByDoctorId(doctorId);
                    sendResponse(exchange, "{\"prescriptions\":" + toJson(prescriptions) + ",\"count\":" + prescriptions.size() + "}");
                } else if (path.matches("/api/doctor-workstation/prescription-items/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int prescriptionId = Integer.parseInt(idStr);
                    List<PrescriptionItem> items = new PrescriptionItemService().getPrescriptionItemsByPrescriptionId(prescriptionId);
                    sendResponse(exchange, "{\"items\":" + toJson(items) + ",\"count\":" + items.size() + "}");
                } else if (path.matches("/api/doctor-workstation/prescription/price/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int prescriptionId = Integer.parseInt(idStr);
                    List<PrescriptionItem> items = new PrescriptionItemService().getPrescriptionItemsByPrescriptionId(prescriptionId);
                    java.math.BigDecimal total = new PrescriptionService().calculateTotalPrice(items);
                    Prescription prescription = new PrescriptionService().getPrescriptionById(prescriptionId);
                    if (prescription != null) {
                        prescription.setTotalPrice(total);
                        new PrescriptionService().updatePrescription(prescription);
                        sendResponse(exchange, "{\"success\":true,\"totalPrice\":" + total + "}");
                    } else {
                        sendError(exchange, 404, "Prescription not found");
                    }
                } else if (path.matches("/api/doctor-workstation/prescription/cancel/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int prescriptionId = Integer.parseInt(idStr);
                    Prescription prescription = new PrescriptionService().getPrescriptionById(prescriptionId);
                    if (prescription != null) {
                        prescription.setStatus("cancelled");
                        new PrescriptionService().updatePrescription(prescription);
                        sendResponse(exchange, "{\"success\":true}");
                    } else {
                        sendError(exchange, 404, "Prescription not found");
                    }
                } else if ("/api/doctor-workstation/prescription-with-items".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    int patientId = Integer.parseInt(params.get("patientId"));
                    int doctorId = Integer.parseInt(params.get("doctorId"));
                    int registrationId = Integer.parseInt(params.get("registrationId"));
                    String itemsStr = params.get("items");
                    
                    Prescription prescription = new Prescription();
                    prescription.setPatientId(patientId);
                    prescription.setDoctorId(doctorId);
                    prescription.setRegistrationId(registrationId);
                    prescription.setItems(itemsStr);
                    prescription.setStatus("pending");
                    prescription.setTotalPrice(java.math.BigDecimal.ZERO);
                    int prescriptionId = new PrescriptionService().addPrescription(prescription);
                    sendResponse(exchange, "{\"success\":" + (prescriptionId > 0) + ",\"prescriptionId\":" + prescriptionId + "}");
                } else if ("/api/doctor-workstation/create-registration-and-prescription".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    int patientId = Integer.parseInt(params.get("patientId"));
                    int doctorId = Integer.parseInt(params.get("doctorId"));
                    String dept = params.get("dept");
                    String regFee = params.get("regFee");
                    String items = params.get("items");
                    
                    Registration registration = new Registration();
                    registration.setPatientId(patientId);
                    registration.setDoctorId(doctorId);
                    registration.setDept(dept);
                    registration.setRegFee(new java.math.BigDecimal(regFee != null ? regFee : "10"));
                    registration.setRegStatus("treating");
                    int regId = new RegistrationService().register(registration);
                    
                    double totalPrice = 0;
                    if (items != null && !items.isEmpty()) {
                        String[] itemParts = items.split("\\|");
                        for (String item : itemParts) {
                            String[] parts = item.split(",");
                            if (parts.length >= 3) {
                                try {
                                    double itemPrice = Double.parseDouble(parts[2]);
                                    int num = Integer.parseInt(parts[1]);
                                    totalPrice += itemPrice * num;
                                } catch (Exception e) { e.printStackTrace(); }
                            }
                        }
                    }
                    
                    Prescription prescription = new Prescription();
                    prescription.setPatientId(patientId);
                    prescription.setDoctorId(doctorId);
                    prescription.setRegistrationId(regId);
                    prescription.setItems(items);
                    prescription.setTotalPrice(new java.math.BigDecimal(totalPrice));
                    prescription.setStatus("pending");
                    int preId = new PrescriptionService().addPrescription(prescription);
                    
                    sendResponse(exchange, "{\"success\":true,\"registrationId\":" + regId + ",\"prescriptionId\":" + preId + "}");
                } else if ("/api/doctor-workstation/create-registration-and-record".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    int patientId = Integer.parseInt(params.get("patientId"));
                    int doctorId = Integer.parseInt(params.get("doctorId"));
                    String dept = params.get("dept");
                    String regFee = params.get("regFee");
                    
                    Registration registration = new Registration();
                    registration.setPatientId(patientId);
                    registration.setDoctorId(doctorId);
                    registration.setDept(dept);
                    registration.setRegFee(new java.math.BigDecimal(regFee != null ? regFee : "10"));
                    registration.setRegStatus("treating");
                    int regId = new RegistrationService().register(registration);
                    
                    MedicalRecord record = new MedicalRecord();
                    record.setPatientId(patientId);
                    record.setDoctorId(doctorId);
                    record.setRegistrationId(regId);
                    if (params.get("chiefComplaint") != null) record.setChiefComplaint(params.get("chiefComplaint"));
                    if (params.get("presentIllness") != null) record.setPresentIllness(params.get("presentIllness"));
                    if (params.get("pastHistory") != null) record.setPastHistory(params.get("pastHistory"));
                    if (params.get("physicalExam") != null) record.setPhysicalExam(params.get("physicalExam"));
                    if (params.get("diagnosis") != null) record.setDiagnosis(params.get("diagnosis"));
                    if (params.get("treatmentPlan") != null) record.setTreatmentPlan(params.get("treatmentPlan"));
                    int mrId = new MedicalRecordService().addRecord(record);
                    
                    sendResponse(exchange, "{\"success\":true,\"registrationId\":" + regId + ",\"medicalRecordId\":" + mrId + "}");
                } else if ("/api/doctor-workstation/prescription/check".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, Object> params = parseJsonToMap(body);
                    int patientId = ((Number) params.get("patientId")).intValue();
                    List<Map<String, Object>> drugs = (List<Map<String, Object>>) params.get("drugs");
                    Map<String, Object> result = new PrescriptionWarningService().checkPrescription(patientId, drugs);
                    sendResponse(exchange, toJson(result));
                } else if (path.matches("/api/doctor-workstation/patient/\\d+/history") && "GET".equals(method)) {
                    String[] parts = path.split("/");
                    int patientId = Integer.parseInt(parts[4]);
                    Patient patient = new PatientService().getPatientById(patientId);
                    if (patient == null) {
                        sendError(exchange, 404, "Patient not found");
                        return;
                    }
                    List<MedicalRecord> records = new MedicalRecordService().getRecordsByPatientId(patientId);
                    List<Prescription> prescriptions = new PrescriptionService().getPrescriptionsByPatientId(patientId);
                    List<String> allergies = new ArrayList<>();
                    if (patient.getAllergyHistory() != null && !patient.getAllergyHistory().isEmpty()) {
                        allergies = Arrays.asList(patient.getAllergyHistory().split("[,、，]"));
                    }
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("records", records);
                    result.put("prescriptions", prescriptions);
                    result.put("allergies", allergies);
                    sendResponse(exchange, toJson(result));
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
