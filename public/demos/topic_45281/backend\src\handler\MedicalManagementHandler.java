package handler;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import bean.*;
import dao.impl.*;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.google.gson.Gson;

public class MedicalManagementHandler implements HttpHandler {
    private UserPermissionDAOImpl permDao = new UserPermissionDAOImpl();
    private QualityControlCheckDAOImpl qcDao = new QualityControlCheckDAOImpl();
    private CriticalValueReportDAOImpl cvDao = new CriticalValueReportDAOImpl();
    private InfectionSurveillanceDAOImpl infDao = new InfectionSurveillanceDAOImpl();
    private AdverseEventDAOImpl aeDao = new AdverseEventDAOImpl();
    private InfectiousDiseaseReportDAOImpl idrDao = new InfectiousDiseaseReportDAOImpl();
    private Gson gson = new Gson();

    @Override public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        if ("OPTIONS".equals(exchange.getRequestMethod())) { exchange.sendResponseHeaders(204, -1); return; }
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        Map<String,String> params = parseQuery(exchange.getRequestURI().getQuery());
        try {
            if (path.startsWith("/api/permissions")) handlePermission(exchange, method, path, params);
            else if (path.startsWith("/api/quality-checks")) handleQualityCheck(exchange, method, path, params);
            else if (path.startsWith("/api/critical-values")) handleCriticalValue(exchange, method, path, params);
            else if (path.startsWith("/api/infection-surveillances")) handleInfection(exchange, method, path, params);
            else if (path.startsWith("/api/adverse-events")) handleAdverseEvent(exchange, method, path, params);
            else if (path.startsWith("/api/infectious-disease-reports")) handleInfectiousDisease(exchange, method, path, params);
        } catch (Exception e) { e.printStackTrace(); sendResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}"); }
    }

    private void handlePermission(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            if (params.containsKey("user_id")) { sendResponse(exchange, 200, gson.toJson(permDao.findByUserId(Integer.parseInt(params.get("user_id"))))); }
            else { String mc = params.getOrDefault("module_code",""); String st = params.getOrDefault("status",""); int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10")); sendResponse(exchange, 200, gson.toJson(permDao.findPermissions(mc.isEmpty()?null:mc, st.isEmpty()?null:st, page, size))); }
        } else if ("POST".equals(method)) {
            UserPermission obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),UserPermission.class);
            int id = permDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            UserPermission obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),UserPermission.class);
            int rows = permDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handleQualityCheck(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String ct = params.getOrDefault("check_type",""); String st = params.getOrDefault("status","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(qcDao.findChecks(ct.isEmpty()?null:ct, st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            QualityControlCheck obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),QualityControlCheck.class);
            int id = qcDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            QualityControlCheck obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),QualityControlCheck.class);
            int rows = qcDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handleCriticalValue(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String st = params.getOrDefault("status",""); int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(cvDao.findReports(st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            CriticalValueReport obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),CriticalValueReport.class);
            int id = cvDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            CriticalValueReport obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),CriticalValueReport.class);
            int rows = cvDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handleInfection(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String it = params.getOrDefault("infection_type",""); String st = params.getOrDefault("status","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(infDao.findSurveillances(it.isEmpty()?null:it, st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            InfectionSurveillance obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),InfectionSurveillance.class);
            int id = infDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            InfectionSurveillance obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),InfectionSurveillance.class);
            int rows = infDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handleAdverseEvent(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String et = params.getOrDefault("event_type",""); String st = params.getOrDefault("status","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(aeDao.findEvents(et.isEmpty()?null:et, st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            AdverseEvent obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),AdverseEvent.class);
            int id = aeDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            AdverseEvent obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),AdverseEvent.class);
            int rows = aeDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handleInfectiousDisease(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String dc = params.getOrDefault("disease_category",""); String st = params.getOrDefault("status","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(idrDao.findReports(dc.isEmpty()?null:dc, st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            InfectiousDiseaseReport obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),InfectiousDiseaseReport.class);
            int id = idrDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            InfectiousDiseaseReport obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),InfectiousDiseaseReport.class);
            int rows = idrDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void sendResponse(HttpExchange exchange,int code,String resp) throws IOException { byte[] bytes = resp.getBytes("UTF-8"); exchange.sendResponseHeaders(code, bytes.length); try(OutputStream os = exchange.getResponseBody()){os.write(bytes);} }
    private Map<String,String> parseQuery(String query){Map<String,String> params=new HashMap<>();if(query!=null&&!query.isEmpty())for(String pair:query.split("&")){String[]kv=pair.split("=");if(kv.length==2)params.put(kv[0],kv[1]);}return params;}
}
