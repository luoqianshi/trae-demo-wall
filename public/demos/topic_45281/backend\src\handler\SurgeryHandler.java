package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Surgery;
import bean.MedicalRecordArchive;
import service.SurgeryService;
import service.MedicalRecordArchiveService;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.Date;
import java.text.SimpleDateFormat;

public class SurgeryHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                SurgeryService service = new SurgeryService();

                if ("/api/surgeries".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<Surgery> list;
                    if (query != null && query.contains("patientId=")) {
                        int patientId = Integer.parseInt(query.substring(query.indexOf("patientId=") + 10).split("&")[0]);
                        list = service.getByPatientId(patientId);
                    } else if (query != null && query.contains("status=")) {
                        String status = query.substring(query.indexOf("status=") + 7);
                        list = service.getByStatus(java.net.URLDecoder.decode(status, "UTF-8"));
                    } else if (query != null && query.contains("dept=")) {
                        String dept = query.substring(query.indexOf("dept=") + 5);
                        list = service.getByDept(java.net.URLDecoder.decode(dept, "UTF-8"));
                    } else {
                        list = service.getAll();
                    }
                    sendResponse(exchange, "{\"items\":" + toJson(list) + ",\"count\":" + list.size() + "}");
                } else if ("/api/surgeries".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Surgery surgery = new Surgery();
                    surgery.setPatientId(getIntParam(params, "patientId"));
                    surgery.setPatientName(params.get("patientName") != null ? params.get("patientName") : "");
                    surgery.setSurgeryName(params.get("surgeryName") != null ? params.get("surgeryName") : "");
                    surgery.setSurgeryType(params.get("surgeryType") != null ? params.get("surgeryType") : "");
                    surgery.setDept(params.get("dept") != null ? params.get("dept") : "");
                    surgery.setDoctorId(getIntParam(params, "doctorId"));
                    surgery.setDoctorName(params.get("doctorName") != null ? params.get("doctorName") : "");
                    surgery.setSurgeryRoom(params.get("surgeryRoom") != null ? params.get("surgeryRoom") : "");
                    surgery.setSurgeonName(params.get("surgeonName") != null ? params.get("surgeonName") : "");
                    surgery.setAnesthesiaType(params.get("anesthesiaType") != null ? params.get("anesthesiaType") : "");
                    surgery.setAnesthesiaDoctor(params.get("anesthesiaDoctor") != null ? params.get("anesthesiaDoctor") : "");
                    surgery.setStatus(params.get("status") != null ? params.get("status") : "scheduled");
                    surgery.setDiagnosis(params.get("diagnosis") != null ? params.get("diagnosis") : "");
                    surgery.setRemark(params.get("remark") != null ? params.get("remark") : "");
                    surgery.setDuration(getIntParam(params, "duration"));
                    if (params.get("surgeryFee") != null && !params.get("surgeryFee").isEmpty()) {
                        surgery.setSurgeryFee(new java.math.BigDecimal(params.get("surgeryFee")));
                    }
                    if (params.get("anesthesiaFee") != null && !params.get("anesthesiaFee").isEmpty()) {
                        surgery.setAnesthesiaFee(new java.math.BigDecimal(params.get("anesthesiaFee")));
                    }
                    if (params.get("surgeryDate") != null && !params.get("surgeryDate").isEmpty()) {
                        surgery.setSurgeryDate(new java.text.SimpleDateFormat("yyyy-MM-dd").parse(params.get("surgeryDate")));
                    }
                    if (params.get("surgeryTime") != null && !params.get("surgeryTime").isEmpty()) {
                        surgery.setSurgeryTime(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(params.get("surgeryTime")));
                    } else {
                        surgery.setSurgeryTime(new java.util.Date());
                    }
                    int result = service.add(surgery);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/surgeries/\\d+") && "PUT".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Surgery surgery = service.getById(id);
                    if (surgery == null) {
                        sendError(exchange, 404, "Surgery not found");
                        return;
                    }
                    if (params.get("surgeryName") != null) surgery.setSurgeryName(params.get("surgeryName"));
                    if (params.get("surgeryType") != null) surgery.setSurgeryType(params.get("surgeryType"));
                    if (params.get("dept") != null) surgery.setDept(params.get("dept"));
                    if (params.get("doctorId") != null) surgery.setDoctorId(getIntParam(params, "doctorId"));
                    if (params.get("doctorName") != null) surgery.setDoctorName(params.get("doctorName"));
                    if (params.get("surgeryRoom") != null) surgery.setSurgeryRoom(params.get("surgeryRoom"));
                    if (params.get("surgeonName") != null) surgery.setSurgeonName(params.get("surgeonName"));
                    if (params.get("anesthesiaType") != null) surgery.setAnesthesiaType(params.get("anesthesiaType"));
                    if (params.get("anesthesiaDoctor") != null) surgery.setAnesthesiaDoctor(params.get("anesthesiaDoctor"));
                    if (params.get("diagnosis") != null) surgery.setDiagnosis(params.get("diagnosis"));
                    if (params.get("remark") != null) surgery.setRemark(params.get("remark"));
                    if (params.get("duration") != null) surgery.setDuration(getIntParam(params, "duration"));
                    if (params.get("surgeryFee") != null && !params.get("surgeryFee").isEmpty()) surgery.setSurgeryFee(new java.math.BigDecimal(params.get("surgeryFee")));
                    if (params.get("anesthesiaFee") != null && !params.get("anesthesiaFee").isEmpty()) surgery.setAnesthesiaFee(new java.math.BigDecimal(params.get("anesthesiaFee")));
                    if (params.get("patientName") != null) surgery.setPatientName(params.get("patientName"));
                    String oldStatus = surgery.getStatus();
                    if (params.get("status") != null) surgery.setStatus(params.get("status"));
                    int result = service.update(surgery);
                    if ("completed".equals(params.get("status")) && !"completed".equals(oldStatus)) {
                        try {
                            MedicalRecordArchiveService archiveService = new MedicalRecordArchiveService();
                            MedicalRecordArchive archive = new MedicalRecordArchive();
                            archive.setPatientId(surgery.getPatientId());
                            archive.setPatientName(surgery.getPatientName());
                            archive.setMedicalRecordId(0);
                            archive.setRecordId(0);
                            archive.setIcdCode("");
                            archive.setIcdName(surgery.getDiagnosis() != null ? surgery.getDiagnosis() : "");
                            archive.setQualityScore(0);
                            archive.setArchiveStatus("pending");
                            archive.setArchivist(surgery.getDoctorName() != null ? surgery.getDoctorName() : "");
                            archive.setArchiveDate(new java.util.Date());
                            archive.setRemark("手术完成自动生成: " + (surgery.getSurgeryName() != null ? surgery.getSurgeryName() : ""));
                            archiveService.add(archive);
                        } catch (Exception ae) {
                            System.err.println("Auto archive creation failed: " + ae.getMessage());
                        }
                    }
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/surgeries/\\d+") && "GET".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    Surgery surgery = service.getById(id);
                    if (surgery == null) {
                        sendError(exchange, 404, "Surgery not found");
                        return;
                    }
                    sendResponse(exchange, toJson(surgery));
                } else if (path.matches("/api/surgeries/\\d+") && "DELETE".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    int result = service.delete(id);
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
