package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.CompanionService;
import java.util.Map;
import java.util.Date;

public class CompanionHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();
            dao.impl.CompanionServiceDAOImpl dao = new dao.impl.CompanionServiceDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery();
                if (q!=null && q.contains("patientId=")) {
                    int pid = Integer.parseInt(q.substring(q.indexOf("patientId=")+10).split("&")[0]);
                    sendResponse(exchange, "{\"items\":"+dao.findByCompanionPatientId(pid)+"}");
                } else if (q!=null && q.contains("inpatientId=")) {
                    int iid = Integer.parseInt(q.substring(q.indexOf("inpatientId=")+11).split("&")[0]);
                    sendResponse(exchange, "{\"items\":"+dao.findByInpatientId(iid)+"}");
                } else { sendResponse(exchange, "[]"); }
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                CompanionService c = new CompanionService();
                c.setPatientId(getIntParam(params,"patientId")); c.setPatientName(params.get("patientName"));
                c.setInpatientId(getIntParamOrNull(params,"inpatientId")); c.setCompanionName(params.get("companionName"));
                c.setCompanionPhone(params.get("companionPhone")); c.setCompanionIdCard(params.get("companionIdCard"));
                c.setRelation(params.get("relation"));
                try{c.setStartDate(java.sql.Date.valueOf(params.get("startDate")));}catch (Exception e) { e.printStackTrace(); }
                int id = dao.insert(c); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/companions/\\d+/end") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.split("/")[3]); dao.endService(id);
                sendResponse(exchange, "{\"success\":true}");
            }
        }
}
