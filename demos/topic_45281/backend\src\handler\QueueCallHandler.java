package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.QueueCall;
import service.QueueCallService;
import java.util.List;
import java.util.Map;

public class QueueCallHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/queue-calls".equals(path) && "GET".equals(method)) {
                    List<QueueCall> queueCalls = new QueueCallService().getAllQueueCalls();
                    sendResponse(exchange, "{\"queueCalls\":" + toJson(queueCalls) + ",\"count\":" + queueCalls.size() + "}");
                } else if (path.matches("/api/queue-calls/dept/[^/]+") && "GET".equals(method)) {
                    String dept = path.substring(path.lastIndexOf('/') + 1);
                    try {
                        dept = java.net.URLDecoder.decode(dept, "UTF-8");
                    } catch (Exception e) { e.printStackTrace(); }
                    List<QueueCall> queueCalls = new QueueCallService().getQueueCallsByDept(dept);
                    sendResponse(exchange, "{\"queueCalls\":" + toJson(queueCalls) + ",\"count\":" + queueCalls.size() + "}");
                } else if (path.matches("/api/queue-calls/status/[^/]+") && "GET".equals(method)) {
                    String status = path.substring(path.lastIndexOf('/') + 1);
                    List<QueueCall> queueCalls = new QueueCallService().getQueueCallsByCallStatus(status);
                    sendResponse(exchange, "{\"queueCalls\":" + toJson(queueCalls) + ",\"count\":" + queueCalls.size() + "}");
                } else if ("/api/queue-calls".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    QueueCall queueCall = new QueueCall();
                    if (params.get("registrationId") != null && !params.get("registrationId").isEmpty()) {
                        queueCall.setRegistrationId(Integer.parseInt(params.get("registrationId")));
                    }
                    if (params.get("dept") != null) queueCall.setDept(params.get("dept"));
                    if (params.get("doctorId") != null && !params.get("doctorId").isEmpty()) {
                        queueCall.setDoctorId(Integer.parseInt(params.get("doctorId")));
                    }
                    if (params.get("queueNo") != null) queueCall.setQueueNo(params.get("queueNo"));
                    if (params.get("callStatus") != null) queueCall.setCallStatus(params.get("callStatus"));
                    else queueCall.setCallStatus("waiting");
                    int result = new QueueCallService().addQueueCall(queueCall);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/queue-calls/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    QueueCall queueCall = new QueueCall();
                    queueCall.setId(id);
                    if (params.get("callStatus") != null) queueCall.setCallStatus(params.get("callStatus"));
                    if (params.get("operator") != null) queueCall.setOperator(params.get("operator"));
                    int result = new QueueCallService().updateQueueCall(queueCall);
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
