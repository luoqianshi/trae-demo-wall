package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Consultation;
import bean.ConsultationMessage;
import java.util.List;
import java.util.Map;

public class ConsultationHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.ConsultationDAOImpl consulDao = new dao.impl.ConsultationDAOImpl();
            dao.impl.ConsultationMessageDAOImpl msgDao = new dao.impl.ConsultationMessageDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery();
                if (q!=null && q.contains("id=")) {
                    int id = Integer.parseInt(q.substring(q.indexOf("id=")+3).split("&")[0]);
                    Consultation c = consulDao.findConsultById(id);
                    if (c!=null) { List<ConsultationMessage> msgs = msgDao.findByConsultationId(id); sendResponse(exchange, "{\"consultation\":"+toJson(c)+",\"messages\":"+toJson(msgs)+"}"); }
                    else sendResponse(exchange, "null");
                } else if (q!=null && q.contains("doctorId=")) {
                    int did = Integer.parseInt(q.substring(q.indexOf("doctorId=")+9).split("&")[0]);
                    sendResponse(exchange, "{\"items\":"+consulDao.findByConsultDoctorId(did)+"}");
                } else if (q!=null && q.contains("patientId=")) {
                    int pid = Integer.parseInt(q.substring(q.indexOf("patientId=")+10).split("&")[0]);
                    sendResponse(exchange, "{\"items\":"+consulDao.findByConsultPatientId(pid)+"}");
                } else { sendResponse(exchange, "[]"); }
            } else if ("/api/consultations".equals(path) && "POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                Consultation c = new Consultation();
                c.setPatientId(getIntParam(params,"patientId")); c.setPatientName(params.get("patientName"));
                c.setDoctorId(getIntParam(params,"doctorId")); c.setDoctorName(params.get("doctorName"));
                c.setDeptName(params.get("deptName")); c.setSubject(params.get("subject"));
                int id = consulDao.insert(c); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/consultations/\\d+/messages") && "POST".equals(method)) {
                int cid = Integer.parseInt(path.split("/")[3]);
                Map<String,String> params = parseJson(getRequestBody(exchange));
                ConsultationMessage m = new ConsultationMessage();
                m.setConsultationId(cid); m.setSenderId(getIntParam(params,"senderId"));
                m.setSenderRole(params.get("senderRole")); m.setSenderName(params.get("senderName"));
                m.setMessageType(params.get("messageType")); m.setContent(params.get("content"));
                int id = msgDao.insert(m); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/consultations/\\d+") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                Map<String,String> params = parseJson(getRequestBody(exchange));
                consulDao.updateStatus(id, params.get("status")); sendResponse(exchange, "{\"success\":true}");
            }
        }
}