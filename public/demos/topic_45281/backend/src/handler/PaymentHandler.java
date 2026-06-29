package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.PaymentRecord;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public class PaymentHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.PaymentRecordDAOImpl dao = new dao.impl.PaymentRecordDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery(); int page=1,size=20;
                if (q != null) for (String p : q.split("&")) { String[] kv=p.split("="); if (kv.length==2) {
                    if ("page".equals(kv[0])) page=Integer.parseInt(kv[1]); else if ("size".equals(kv[0])) size=Integer.parseInt(kv[1]);
                    else if ("patientId".equals(kv[0])) { List<PaymentRecord> list = dao.findPaymentsByPatientId(Integer.parseInt(kv[1])); sendResponse(exchange, "{\"items\":"+toJson(list)+",\"count\":"+list.size()+"}"); return; }
                    else if ("orderNo".equals(kv[0])) { PaymentRecord r = dao.findByOrderNo(kv[1]); sendResponse(exchange, r!=null?toJson(r):"null"); return; }
                }}
                sendResponse(exchange, "{\"items\":"+dao.findAllPayments(page,size)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                PaymentRecord r = new PaymentRecord();
                r.setOrderNo(params.get("orderNo")!=null?params.get("orderNo"):"PAY"+System.currentTimeMillis());
                r.setPatientId(getIntParam(params,"patientId")); r.setPatientName(params.get("patientName"));
                r.setBusinessType(params.get("businessType")); r.setBusinessId(getIntParam(params,"businessId"));
                try{r.setAmount(new java.math.BigDecimal(params.get("amount")));}catch (Exception e) { e.printStackTrace(); }
                r.setPaymentMethod(params.get("paymentMethod")); r.setPaymentStatus(params.get("paymentStatus"));
                r.setPayerName(params.get("payerName")); r.setCashierId(getIntParam(params,"cashierId"));
                r.setCashierName(params.get("cashierName"));
                int id = dao.insert(r); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+",\"orderNo\":\""+r.getOrderNo()+"\"}");
            } else if (path.matches("/api/payments/\\d+") && "PUT".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                dao.updateStatus(params.get("orderNo"), params.get("status"));
                sendResponse(exchange, "{\"success\":true}");
            }
        }
}
