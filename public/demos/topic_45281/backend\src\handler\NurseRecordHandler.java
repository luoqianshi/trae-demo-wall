package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.VitalSign;
import bean.NurseRecord;
import service.NurseRecordService;
import service.VitalSignService;
import java.util.List;
import java.util.Map;
import java.util.Date;
import java.text.SimpleDateFormat;

public class NurseRecordHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                NurseRecordService service = new NurseRecordService();

                if ("/api/nurse-records".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<NurseRecord> list;
                    if (query != null && query.contains("inpatientId=")) {
                        int inpatientId = Integer.parseInt(query.substring(query.indexOf("inpatientId=") + 12).split("&")[0]);
                        list = service.getByInpatientId(inpatientId);
                    } else {
                        list = service.getAll();
                    }
                    sendResponse(exchange, "{\"items\":" + toJsonNurseRecordList(list) + ",\"count\":" + list.size() + "}");
                } else if ("/api/nurse-records".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    NurseRecord record = new NurseRecord();
                    record.setInpatientId(getIntParam(params, "inpatientId"));
                    if (params.get("patientName") != null) record.setPatientName(params.get("patientName"));
                    if (params.get("nursingNotes") != null) record.setNursingNotes(params.get("nursingNotes"));
                    if (params.get("content") != null) record.setContent(params.get("content"));
                    if (params.get("nurseName") != null) record.setNurseName(params.get("nurseName"));
                    if (params.get("nurseId") != null && !params.get("nurseId").isEmpty()) record.setNurseId(Integer.parseInt(params.get("nurseId")));
                    record.setType(params.get("type") != null ? params.get("type") : "routine");
                    if (params.get("vitalSigns") != null) {
                        record.setVitalSigns(params.get("vitalSigns"));
                        record.setContent(params.get("vitalSigns"));
                    }
                    if (params.get("recordTime") != null && !params.get("recordTime").isEmpty()) {
                        try {
                            record.setRecordTime(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(params.get("recordTime")));
                        } catch (Exception e) {
                            try {
                                record.setRecordTime(new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").parse(params.get("recordTime")));
                            } catch (Exception e2) {
                                record.setRecordTime(new java.util.Date());
                            }
                        }
                    } else {
                        record.setRecordTime(new java.util.Date());
                    }
                    int result = service.add(record);
                    if (result > 0 && params.get("vitalSigns") != null) {
                        try {
                            String vsJson = params.get("vitalSigns");
                            VitalSign vs = new VitalSign();
                            vs.setInpatientId(record.getInpatientId());
                            java.util.regex.Matcher tempM = java.util.regex.Pattern.compile("\"temperature\"\\s*:\\s*([\\d.]+)").matcher(vsJson);
                            if (tempM.find()) vs.setTemperature(Double.parseDouble(tempM.group(1)));
                            java.util.regex.Matcher pulseM = java.util.regex.Pattern.compile("\"pulse\"\\s*:\\s*(\\d+)").matcher(vsJson);
                            if (pulseM.find()) vs.setPulse(Integer.parseInt(pulseM.group(1)));
                            java.util.regex.Matcher bpM = java.util.regex.Pattern.compile("\"bloodPressure\"\\s*:\\s*\"?(\\d+)/?(\\d+)?\"?").matcher(vsJson);
                            if (bpM.find()) {
                                vs.setBloodPressureHigh(Integer.parseInt(bpM.group(1)));
                                if (bpM.group(2) != null) vs.setBloodPressureLow(Integer.parseInt(bpM.group(2)));
                            }
                            java.util.regex.Matcher spo2M = java.util.regex.Pattern.compile("\"oxygenSaturation\"\\s*:\\s*(\\d+)").matcher(vsJson);
                            if (spo2M.find()) vs.setOxygenSaturation(Integer.parseInt(spo2M.group(1)));
                            java.util.regex.Matcher respM = java.util.regex.Pattern.compile("\"respiration\"\\s*:\\s*(\\d+)").matcher(vsJson);
                            if (respM.find()) vs.setRespiration(Integer.parseInt(respM.group(1)));
                            vs.setNurseName(record.getNurseName() != null ? record.getNurseName() : "");
                            vs.setRecordTime(record.getRecordTime() != null ? record.getRecordTime() : new java.util.Date());
                            new VitalSignService().add(vs);
                        } catch (Exception e) {
                            System.out.println("[NurseRecordHandler] Failed to sync vital_sign: " + e.getMessage());
                        }
                    }
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/nurse-records/\\d+") && "PUT".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    NurseRecord record = service.getById(id);
                    if (record == null) {
                        sendError(exchange, 404, "NurseRecord not found");
                        return;
                    }
                    if (params.get("content") != null) record.setContent(params.get("content"));
                    if (params.get("nursingNotes") != null) record.setNursingNotes(params.get("nursingNotes"));
                    if (params.get("nurseName") != null) record.setNurseName(params.get("nurseName"));
                    if (params.get("nurseId") != null && !params.get("nurseId").isEmpty()) record.setNurseId(Integer.parseInt(params.get("nurseId")));
                    if (params.get("type") != null) record.setType(params.get("type"));
                    if (params.get("vitalSigns") != null) record.setVitalSigns(params.get("vitalSigns"));
                    int result = service.update(record);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/nurse-records/\\d+") && "DELETE".equals(method)) {
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

    private String toJsonNurseRecordList(List<NurseRecord> list) {
        if (list == null || list.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            NurseRecord r = list.get(i);
            sb.append("{");
            sb.append("\"id\":").append(r.getId()).append(",");
            sb.append("\"inpatientId\":").append(r.getInpatientId()).append(",");
            sb.append("\"patientName\":").append(r.getPatientName() != null ? "\"" + escapeJson(r.getPatientName()) + "\"" : "null").append(",");
            String vs = r.getVitalSigns() != null ? r.getVitalSigns() : (r.getContent() != null ? r.getContent() : "{}");
            if (!vs.startsWith("{")) vs = "{}";
            sb.append("\"vitalSigns\":").append(vs).append(",");
            sb.append("\"nursingNotes\":").append(r.getNursingNotes() != null ? "\"" + escapeJson(r.getNursingNotes()) + "\"" : (r.getContent() != null ? "\"" + escapeJson(r.getContent()) + "\"" : "null")).append(",");
            sb.append("\"nurseId\":").append(r.getNurseId()).append(",");
            sb.append("\"nurseName\":").append(r.getNurseName() != null ? "\"" + escapeJson(r.getNurseName()) + "\"" : "null").append(",");
            sb.append("\"recordTime\":").append(r.getRecordTime() != null ? "\"" + r.getRecordTime() + "\"" : "null").append(",");
            sb.append("\"createTime\":").append(r.getCreateTime() != null ? "\"" + r.getCreateTime() + "\"" : "null");
            sb.append("}");
        }
        sb.append("]");
        return sb.toString();
    }
}
