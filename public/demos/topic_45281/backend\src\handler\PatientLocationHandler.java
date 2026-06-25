package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Patient;
import bean.PatientLocation;
import java.util.Map;

public class PatientLocationHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.PatientLocationDAOImpl dao = new dao.impl.PatientLocationDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery();
                if (q!=null && q.contains("patientId=")) {
                    int pid = Integer.parseInt(q.substring(q.indexOf("patientId=")+10).split("&")[0]);
                    sendResponse(exchange, "{\"items\":"+dao.findByLocPatientId(pid)+"}");
                } else { sendResponse(exchange, "[]"); }
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                PatientLocation l = new PatientLocation();
                l.setPatientId(getIntParam(params,"patientId")); l.setPatientName(params.get("patientName"));
                l.setLocationType(params.get("locationType")); l.setAreaName(params.get("areaName"));
                l.setRoomNo(params.get("roomNo")); l.setFloor(params.get("floor")); l.setBuilding(params.get("building"));
                int id = dao.insert(l); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/patient-locations/\\d+/checkout") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.split("/")[3]); dao.checkOut(id);
                sendResponse(exchange, "{\"success\":true}");
            }
        }
}
