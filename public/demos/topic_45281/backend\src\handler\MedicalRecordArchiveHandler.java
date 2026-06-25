package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.MedicalRecordArchive;
import bean.NurseRecord;
import bean.Bed;
import java.math.BigDecimal;
import service.MedicalRecordArchiveService;
import java.util.List;
import java.util.Map;
import java.util.Date;

public class MedicalRecordArchiveHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                MedicalRecordArchiveService service = new MedicalRecordArchiveService();

                if ("/api/medical-record-archives".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<MedicalRecordArchive> list;
                    if (query != null && query.contains("status=")) {
                        String status = query.substring(query.indexOf("status=") + 7);
                        list = service.getByStatus(java.net.URLDecoder.decode(status, "UTF-8"));
                    } else {
                        list = service.getAll();
                    }
                    sendResponse(exchange, "{\"items\":" + toJsonArchiveList(list) + ",\"count\":" + list.size() + "}");
                } else if ("/api/medical-record-archives".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    MedicalRecordArchive archive = new MedicalRecordArchive();
                    String recordIdStr = params.get("recordId") != null ? params.get("recordId") : params.get("medicalRecordId");
                    if (recordIdStr != null && !recordIdStr.isEmpty()) {
                        archive.setMedicalRecordId(Integer.parseInt(recordIdStr));
                        archive.setRecordId(Integer.parseInt(recordIdStr));
                    }
                    if (params.get("patientId") != null && !params.get("patientId").isEmpty()) archive.setPatientId(Integer.parseInt(params.get("patientId")));
                    if (params.get("patientName") != null) archive.setPatientName(params.get("patientName"));
                    archive.setIcdCode(params.get("icdCode") != null ? params.get("icdCode") : "");
                    archive.setIcdName(params.get("icdName") != null ? params.get("icdName") : "");
                    archive.setQualityScore(getIntParam(params, "qualityScore"));
                    String statusVal = params.get("status") != null ? params.get("status") : params.get("archiveStatus");
                    archive.setArchiveStatus(statusVal != null ? statusVal : "pending");
                    String archiverVal = params.get("archiver") != null ? params.get("archiver") : params.get("archivist");
                    archive.setArchivist(archiverVal != null ? archiverVal : "");
                    archive.setRemark(params.get("remark") != null ? params.get("remark") : "");
                    archive.setArchiveDate(new java.util.Date());
                    int result = service.add(archive);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/medical-record-archives/\\d+") && "PUT".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    MedicalRecordArchive archive = service.getById(id);
                    if (archive == null) {
                        sendError(exchange, 404, "MedicalRecordArchive not found");
                        return;
                    }
                    if (params.get("icdCode") != null) archive.setIcdCode(params.get("icdCode"));
                    if (params.get("icdName") != null) archive.setIcdName(params.get("icdName"));
                    if (params.get("qualityScore") != null) archive.setQualityScore(getIntParam(params, "qualityScore"));
                    String statusVal = params.get("status") != null ? params.get("status") : params.get("archiveStatus");
                    if (statusVal != null) archive.setArchiveStatus(statusVal);
                    String archiverVal = params.get("archiver") != null ? params.get("archiver") : params.get("archivist");
                    if (archiverVal != null) archive.setArchivist(archiverVal);
                    if (params.get("remark") != null) archive.setRemark(params.get("remark"));
                    int result = service.update(archive);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/medical-record-archives/\\d+") && "POST".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    MedicalRecordArchive archive = service.getById(id);
                    if (archive == null) {
                        sendError(exchange, 404, "MedicalRecordArchive not found");
                        return;
                    }
                    if (params.get("icdCode") != null) archive.setIcdCode(params.get("icdCode"));
                    if (params.get("icdName") != null) archive.setIcdName(params.get("icdName"));
                    if (params.get("qualityScore") != null) archive.setQualityScore(getIntParam(params, "qualityScore"));
                    archive.setArchiveStatus("archived");
                    archive.setArchiveDate(new java.util.Date());
                    String archiverVal = params.get("archiver") != null ? params.get("archiver") : params.get("archivist");
                    if (archiverVal != null) archive.setArchivist(archiverVal);
                    int result = service.update(archive);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/medical-record-archives/\\d+") && "DELETE".equals(method)) {
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

    private String toJsonArchiveList(List<MedicalRecordArchive> list) {
        if (list == null || list.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            MedicalRecordArchive a = list.get(i);
            sb.append("{");
            sb.append("\"id\":").append(a.getId()).append(",");
            sb.append("\"patientId\":").append(a.getPatientId()).append(",");
            sb.append("\"patientName\":").append(a.getPatientName() != null ? "\"" + escapeJson(a.getPatientName()) + "\"" : "null").append(",");
            sb.append("\"recordId\":").append(a.getRecordId()).append(",");
            sb.append("\"medicalRecordId\":").append(a.getMedicalRecordId()).append(",");
            sb.append("\"icdCode\":").append(a.getIcdCode() != null ? "\"" + escapeJson(a.getIcdCode()) + "\"" : "null").append(",");
            sb.append("\"icdName\":").append(a.getIcdName() != null ? "\"" + escapeJson(a.getIcdName()) + "\"" : "null").append(",");
            sb.append("\"status\":").append(a.getArchiveStatus() != null ? "\"" + escapeJson(a.getArchiveStatus()) + "\"" : "null").append(",");
            sb.append("\"qualityScore\":").append(a.getQualityScore()).append(",");
            sb.append("\"archiver\":").append(a.getArchivist() != null ? "\"" + escapeJson(a.getArchivist()) + "\"" : "null").append(",");
            sb.append("\"archiveTime\":").append(a.getArchiveDate() != null ? "\"" + a.getArchiveDate() + "\"" : "null").append(",");
            sb.append("\"createTime\":").append(a.getCreateTime() != null ? "\"" + a.getCreateTime() + "\"" : "null").append(",");
            sb.append("\"remark\":").append(a.getRemark() != null ? "\"" + escapeJson(a.getRemark()) + "\"" : "null");
            sb.append("}");
        }
        sb.append("]");
        return sb.toString();
    }
}
