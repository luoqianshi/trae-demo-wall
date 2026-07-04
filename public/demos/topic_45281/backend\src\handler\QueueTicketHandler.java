package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.QueueTicket;
import java.util.List;
import java.util.Map;
import java.util.Date;

public class QueueTicketHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.QueueTicketDAOImpl dao = new dao.impl.QueueTicketDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery();
                String type="", status=""; int deptId=0;
                if (q != null) for (String p : q.split("&")) { String[] kv=p.split("="); if (kv.length==2) {
                    if ("type".equals(kv[0])) type=kv[1]; else if ("status".equals(kv[0])) status=kv[1]; else if ("deptId".equals(kv[0])) deptId=Integer.parseInt(kv[1]);
                }}
                if (deptId > 0 && "calling".equals(status)) { QueueTicket t = dao.findCurrentCalling(type, deptId); sendResponse(exchange, t!=null ? toJson(t) : "null"); return; }
                List<QueueTicket> list = dao.findByTypeAndStatus(type.isEmpty()?null:type, status.isEmpty()?null:status);
                sendResponse(exchange, "{\"items\":"+toJson(list)+",\"count\":"+list.size()+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                QueueTicket t = new QueueTicket();
                t.setBusinessType(params.get("businessType")); t.setPatientId(getIntParam(params,"patientId"));
                t.setPatientName(params.get("patientName")); t.setTicketNo(params.get("ticketNo")!=null?params.get("ticketNo"):"T"+System.currentTimeMillis());
                t.setDeptId(getIntParam(params,"deptId")); t.setDeptName(params.get("deptName"));
                t.setPriority(getIntParam(params,"priority"));
                int id = dao.insert(t); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+",\"ticketNo\":\""+t.getTicketNo()+"\"}");
            } else if (path.matches("/api/queue-tickets/\\d+") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                Map<String,String> params = parseJson(getRequestBody(exchange));
                QueueTicket t = new QueueTicket(); t.setId(id); t.setStatus(params.get("status"));
                t.setWindowNo(params.get("windowNo")); t.setCalledCount(getIntParam(params,"calledCount"));
                if ("办理中".equals(params.get("status"))) t.setStartTime(new java.util.Date());
                if ("已完成".equals(params.get("status"))) t.setFinishTime(new java.util.Date());
                dao.update(t); sendResponse(exchange, "{\"success\":true}");
            }
        }
}
