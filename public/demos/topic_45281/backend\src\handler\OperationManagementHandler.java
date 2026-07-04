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

public class OperationManagementHandler implements HttpHandler {
    private BedManagementDAOImpl bedDao = new BedManagementDAOImpl();
    private FinanceChargeDAOImpl fcDao = new FinanceChargeDAOImpl();
    private CostAccountingDAOImpl caDao = new CostAccountingDAOImpl();
    private PerformanceAssessmentDAOImpl paDao = new PerformanceAssessmentDAOImpl();
    private EquipmentAssetDAOImpl eaDao = new EquipmentAssetDAOImpl();
    private HrStaffDAOImpl hrDao = new HrStaffDAOImpl();
    private Gson gson = new Gson();

    @Override public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json;charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        if ("OPTIONS".equals(exchange.getRequestMethod())) { exchange.sendResponseHeaders(204, -1); return; }
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();
        Map<String,String> params = parseQuery(exchange.getRequestURI().getQuery());
        try {
            if (path.startsWith("/api/beds")) handleBed(exchange, method, path, params);
            else if (path.startsWith("/api/finance-charges")) handleFinanceCharge(exchange, method, path, params);
            else if (path.startsWith("/api/cost-accountings")) handleCostAccounting(exchange, method, path, params);
            else if (path.startsWith("/api/performance-assessments")) handlePerformance(exchange, method, path, params);
            else if (path.startsWith("/api/equipment-assets")) handleEquipment(exchange, method, path, params);
            else if (path.startsWith("/api/hr-staff")) handleHrStaff(exchange, method, path, params);
        } catch (Exception e) { e.printStackTrace(); sendResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}"); }
    }

    private void handleBed(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String bs = params.getOrDefault("bed_status",""); String bt = params.getOrDefault("bed_type","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(bedDao.findBeds(bs.isEmpty()?null:bs, bt.isEmpty()?null:bt, page, size)));
        } else if ("POST".equals(method)) {
            BedManagement obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),BedManagement.class);
            int id = bedDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            BedManagement obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),BedManagement.class);
            int rows = bedDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handleFinanceCharge(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String ct = params.getOrDefault("charge_type",""); String st = params.getOrDefault("status","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(fcDao.findCharges(ct.isEmpty()?null:ct, st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            FinanceCharge obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),FinanceCharge.class);
            int id = fcDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            FinanceCharge obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),FinanceCharge.class);
            int rows = fcDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handleCostAccounting(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String ap = params.getOrDefault("account_period",""); String st = params.getOrDefault("status","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(caDao.findAccounts(ap.isEmpty()?null:ap, st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            CostAccounting obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),CostAccounting.class);
            int id = caDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            CostAccounting obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),CostAccounting.class);
            int rows = caDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handlePerformance(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String ap = params.getOrDefault("assess_period",""); String st = params.getOrDefault("status","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(paDao.findAssessments(ap.isEmpty()?null:ap, st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            PerformanceAssessment obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),PerformanceAssessment.class);
            int id = paDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            PerformanceAssessment obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),PerformanceAssessment.class);
            int rows = paDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handleEquipment(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String at = params.getOrDefault("asset_type",""); String st = params.getOrDefault("asset_status","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(eaDao.findAssets(at.isEmpty()?null:at, st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            EquipmentAsset obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),EquipmentAsset.class);
            int id = eaDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            EquipmentAsset obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),EquipmentAsset.class);
            int rows = eaDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void handleHrStaff(HttpExchange exchange, String method, String path, Map<String,String> params) throws IOException {
        if ("GET".equals(method)) {
            String ws = params.getOrDefault("work_status",""); String st = params.getOrDefault("staff_type","");
            int page = Integer.parseInt(params.getOrDefault("page","1")); int size = Integer.parseInt(params.getOrDefault("size","10"));
            sendResponse(exchange, 200, gson.toJson(hrDao.findStaff(ws.isEmpty()?null:ws, st.isEmpty()?null:st, page, size)));
        } else if ("POST".equals(method)) {
            HrStaff obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),HrStaff.class);
            int id = hrDao.insert(obj);
            Map<String,Object> r = new HashMap<>();r.put("id",id);r.put("success",id>0); sendResponse(exchange, 200, gson.toJson(r));
        } else if ("PUT".equals(method)) {
            HrStaff obj = gson.fromJson(new String(exchange.getRequestBody().readAllBytes(),"UTF-8"),HrStaff.class);
            int rows = hrDao.update(obj);
            Map<String,Object> r = new HashMap<>();r.put("success",rows>0); sendResponse(exchange, 200, gson.toJson(r));
        }
    }

    private void sendResponse(HttpExchange exchange,int code,String resp) throws IOException { byte[] bytes = resp.getBytes("UTF-8"); exchange.sendResponseHeaders(code, bytes.length); try(OutputStream os = exchange.getResponseBody()){os.write(bytes);} }
    private Map<String,String> parseQuery(String query){Map<String,String> params=new HashMap<>();if(query!=null&&!query.isEmpty())for(String pair:query.split("&")){String[]kv=pair.split("=");if(kv.length==2)params.put(kv[0],kv[1]);}return params;}
}
