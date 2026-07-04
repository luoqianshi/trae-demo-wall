package handler;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import bean.*;
import dao.impl.*;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.google.gson.Gson;

public class LabTestResultHandler implements HttpHandler {
    private LabTestResultDAOImpl dao = new LabTestResultDAOImpl();
    private Gson gson = new Gson();
    @Override public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        String method = exchange.getRequestMethod();
        Map<String,String> params = parseQuery(exchange.getRequestURI().getQuery());
        if ("GET".equals(method)) {
            if (params.containsKey("order_id")) {
                List<LabTestResult> list = dao.findByOrderId(Integer.parseInt(params.get("order_id")));
                sendResponse(exchange, 200, gson.toJson(list));
            } else if (params.containsKey("id")) {
                LabTestResult obj = dao.findById(Integer.parseInt(params.get("id")));
                sendResponse(exchange, 200, gson.toJson(obj));
            }
        } else if ("POST".equals(method)) {
            LabTestResult obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8),LabTestResult.class);
            int id = dao.insert(obj);
            Map<String,Object> result = new HashMap<>();result.put("id",id);result.put("success",id>0);
            sendResponse(exchange, 200, gson.toJson(result));
        }
    }
    private void sendResponse(HttpExchange exchange,int code,String resp) throws IOException { byte[] bytes = resp.getBytes(StandardCharsets.UTF_8); exchange.sendResponseHeaders(code, bytes.length); try(OutputStream os = exchange.getResponseBody()){os.write(bytes);} }
    private Map<String,String> parseQuery(String query){Map<String,String> params=new HashMap<>();if(query!=null&&!query.isEmpty())for(String pair:query.split("&")){String[]kv=pair.split("=");if(kv.length==2)params.put(kv[0],kv[1]);}return params;}
}
