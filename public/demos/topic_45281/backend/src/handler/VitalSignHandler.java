package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.VitalSign;
import bean.Inpatient;
import service.VitalSignService;
import service.InpatientService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Date;

public class VitalSignHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                VitalSignService service = new VitalSignService();

                if ("/api/vital-signs".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<VitalSign> list;
                    if (query != null && query.contains("inpatientId=")) {
                        int inpatientId = Integer.parseInt(query.substring(query.indexOf("inpatientId=") + 12).split("&")[0]);
                        list = service.getByInpatientId(inpatientId);
                    } else if (query != null && query.contains("patientId=")) {
                        int patientId = Integer.parseInt(query.substring(query.indexOf("patientId=") + 10).split("&")[0]);
                        List<Inpatient> inpatients = new InpatientService().getByPatientId(patientId);
                        list = new java.util.ArrayList<>();
                        for (Inpatient ip : inpatients) {
                            list.addAll(service.getByInpatientId(ip.getId()));
                        }
                    } else if (query != null && query.contains("inpatientId=")) {
                        int inpatientId = Integer.parseInt(query.substring(query.indexOf("inpatientId=") + 12).split("&")[0]);
                        list = service.getByInpatientId(inpatientId);
                    } else {
                        list = service.getAll();
                    }
                    sendResponse(exchange, "{\"items\":" + toJson(list) + ",\"count\":" + list.size() + "}");
                } else if ("/api/vital-signs/latest".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    VitalSign latest = null;
                    if (query != null && query.contains("inpatientId=")) {
                        int inpatientId = Integer.parseInt(query.substring(query.indexOf("inpatientId=") + 12).split("&")[0]);
                        latest = service.getLatestByInpatientId(inpatientId);
                    } else if (query != null && query.contains("patientId=")) {
                        int patientId = Integer.parseInt(query.substring(query.indexOf("patientId=") + 10).split("&")[0]);
                        List<Inpatient> inpatients = new InpatientService().getByPatientId(patientId);
                        for (Inpatient ip : inpatients) {
                            VitalSign vs = service.getLatestByInpatientId(ip.getId());
                            if (vs != null && (latest == null || vs.getRecordTime().after(latest.getRecordTime()))) {
                                latest = vs;
                            }
                        }
                    }
                    if (latest != null) {
                        sendResponse(exchange, toJson(latest));
                    } else {
                        sendResponse(exchange, "{}");
                    }
                } else if ("/api/vital-signs".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    VitalSign vs = new VitalSign();
                    vs.setInpatientId(getIntParam(params, "inpatientId"));
                    vs.setTemperature(getDoubleParam(params, "temperature"));
                    vs.setPulse(getIntParam(params, "pulse"));
                    vs.setBloodPressureHigh(getIntParam(params, "bloodPressureHigh"));
                    vs.setBloodPressureLow(getIntParam(params, "bloodPressureLow"));
                    vs.setOxygenSaturation(getIntParam(params, "oxygenSaturation"));
                    vs.setRespiration(getIntParam(params, "respiration"));
                    vs.setNurseName(params.get("nurseName") != null ? params.get("nurseName") : "");
                    vs.setRecordTime(new java.util.Date());
                    int result = service.add(vs);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/vital-signs/\\d+") && "PUT".equals(method)) {
                    int id = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    VitalSign vs = service.getById(id);
                    if (vs == null) {
                        sendError(exchange, 404, "VitalSign not found");
                        return;
                    }
                    if (params.get("temperature") != null) vs.setTemperature(getDoubleParam(params, "temperature"));
                    if (params.get("pulse") != null) vs.setPulse(getIntParam(params, "pulse"));
                    if (params.get("bloodPressureHigh") != null) vs.setBloodPressureHigh(getIntParam(params, "bloodPressureHigh"));
                    if (params.get("bloodPressureLow") != null) vs.setBloodPressureLow(getIntParam(params, "bloodPressureLow"));
                    if (params.get("oxygenSaturation") != null) vs.setOxygenSaturation(getIntParam(params, "oxygenSaturation"));
                    if (params.get("respiration") != null) vs.setRespiration(getIntParam(params, "respiration"));
                    if (params.get("nurseName") != null) vs.setNurseName(params.get("nurseName"));
                    int result = service.update(vs);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/vital-signs/\\d+") && "DELETE".equals(method)) {
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
