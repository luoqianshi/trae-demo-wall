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

public class SurgeryScheduleHandler implements HttpHandler {
    private SurgeryScheduleDAOImpl dao = new SurgeryScheduleDAOImpl();
    private Gson gson = new Gson();
    @Override public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        if ("GET".equals(method)) {
            Map<String,String> params = parseQuery(exchange.getRequestURI().getQuery());
            if (path.contains("/list")) {
                String status = params.getOrDefault("status","");
                int page = Integer.parseInt(params.getOrDefault("page","1"));
                int size = Integer.parseInt(params.getOrDefault("size","10"));
                List<SurgerySchedule> list = dao.findAll(status.isEmpty()?null:status,null,page,size);
                sendResponse(exchange, 200, gson.toJson(list));
            } else if (params.containsKey("surgeon_id")) {
                List<SurgerySchedule> list = dao.findBySurgeonId(Integer.parseInt(params.get("surgeon_id")));
                sendResponse(exchange, 200, gson.toJson(list));
            }
        } else if ("POST".equals(method)) {
            SurgerySchedule obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8),SurgerySchedule.class);
            int id = dao.insert(obj);
            Map<String,Object> result = new HashMap<>();result.put("id",id);result.put("success",id>0);
            sendResponse(exchange, 200, gson.toJson(result));
        } else if ("PUT".equals(method)) {
            SurgerySchedule obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8),SurgerySchedule.class);
            int rows = dao.update(obj);
            Map<String,Object> result = new HashMap<>();result.put("success",rows>0);
            sendResponse(exchange, 200, gson.toJson(result));
        }
    }
    private void sendResponse(HttpExchange exchange,int code,String resp) throws IOException { byte[] bytes = resp.getBytes(StandardCharsets.UTF_8); exchange.sendResponseHeaders(code, bytes.length); try(OutputStream os = exchange.getResponseBody()){os.write(bytes);} }
    private Map<String,String> parseQuery(String query){Map<String,String> params=new HashMap<>();if(query!=null&&!query.isEmpty())for(String pair:query.split("&")){String[]kv=pair.split("=");if(kv.length==2)params.put(kv[0],kv[1]);}return params;}
}
