package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Drug;
import bean.Charge;
import bean.InpatientOrder;
import bean.Inpatient;
import service.DrugService;
import service.ChargeService;
import java.util.Map;
import java.math.BigDecimal;

public class InpatientOrderHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.InpatientOrderDAOImpl dao = new dao.impl.InpatientOrderDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery(); int page=1,size=20; String type="", status="";
                if (q!=null) for(String p:q.split("&")){String[]kv=p.split("=");if(kv.length==2){
                    if("page".equals(kv[0]))page=Integer.parseInt(kv[1]);else if("size".equals(kv[0]))size=Integer.parseInt(kv[1]);
                    else if("type".equals(kv[0]))type=kv[1];else if("status".equals(kv[0]))status=kv[1];
                    else if("inpatientId".equals(kv[0])){
                        sendResponse(exchange,"{\"items\":"+dao.findByInpatientId(Integer.parseInt(kv[1]))+"}");return;
                    }else if("id".equals(kv[0])){
                        InpatientOrder o=dao.findOrderById(Integer.parseInt(kv[1]));sendResponse(exchange,o!=null?toJson(o):"null");return;
                    }}
                }
                sendResponse(exchange, "{\"items\":"+dao.findAllOrders(type,status,page,size)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                InpatientOrder o = new InpatientOrder();
                o.setInpatientId(getIntParam(params,"inpatientId"));o.setPatientId(getIntParam(params,"patientId"));
                o.setPatientName(params.get("patientName"));o.setAdmissionNo(params.get("admissionNo"));
                o.setBedNo(params.get("bedNo"));o.setOrderGroupNo(params.get("orderGroupNo"));
                o.setOrderType(params.getOrDefault("orderType","长期医嘱"));o.setCategory(params.get("category"));
                o.setOrderContent(params.get("orderContent"));o.setDrugId(getIntParamOrNull(params,"drugId"));
                o.setDrugName(params.get("drugName"));o.setDosage(params.get("dosage"));
                o.setDosageUnit(params.get("dosageUnit"));o.setFrequency(params.get("frequency"));
                o.setRoute(params.get("route"));o.setQuantity(getIntParamOrNull(params,"quantity"));
                o.setUnit(params.get("unit"));o.setStartTime(new java.sql.Timestamp(System.currentTimeMillis()));
                o.setDoctorId(getIntParam(params,"doctorId"));o.setDoctorName(params.get("doctorName"));
                o.setPriority(params.getOrDefault("priority","普通"));o.setRemark(params.get("remark"));
                int id = dao.insert(o); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/inpatient-orders/\\d+") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                Map<String,String> params = parseJson(getRequestBody(exchange));
                InpatientOrder o = new InpatientOrder(); o.setId(id);
                o.setStatus(params.get("status"));
                if("已停止".equals(params.get("status"))||"已作废".equals(params.get("status"))){
                    o.setStopTime(new java.sql.Timestamp(System.currentTimeMillis()));
                    o.setStopDoctorId(getIntParamOrNull(params,"stopDoctorId"));o.setStopDoctorName(params.get("stopDoctorName"));
                    o.setStopReason(params.get("stopReason"));
                }
                o.setNurseId(getIntParamOrNull(params,"nurseId"));o.setNurseName(params.get("nurseName"));
                if("执行中".equals(params.get("status"))){
                    o.setExecuteTime(new java.sql.Timestamp(System.currentTimeMillis()));
                }
                o.setReviewerId(getIntParamOrNull(params,"reviewerId"));o.setReviewerName(params.get("reviewerName"));
                if("已审核".equals(params.get("status")))o.setReviewTime(new java.sql.Timestamp(System.currentTimeMillis()));
                dao.update(o);

                if("执行中".equals(params.get("status"))){
                    InpatientOrder order = dao.findOrderById(id);
                    if(order != null && order.getPatientId() > 0){
                        Charge charge = new Charge();
                        charge.setPatientId(order.getPatientId());
                        charge.setPatientName(order.getPatientName());
                        charge.setChargeType("inpatient_order");
                        charge.setRelateId(id);
                        charge.setOperator(order.getNurseName() != null ? order.getNurseName() : order.getDoctorName());
                        charge.setPaymentType("记账");
                        charge.setStatus("待结算");
                        DrugService drugSvc = new DrugService();
                        BigDecimal fee = BigDecimal.ZERO;
                        if(order.getDrugId() != null && order.getDrugId() > 0){
                            Drug d = drugSvc.getDrugById(order.getDrugId());
                            if(d != null && d.getPrice() != null){
                                int qty = order.getQuantity() != null ? order.getQuantity() : 1;
                                fee = d.getPrice().multiply(new BigDecimal(qty));
                            }
                        }
                        charge.setTotalFee(fee);
                        new ChargeService().charge(charge);
                    }
                }

                sendResponse(exchange, "{\"success\":true}");
            } else if (path.matches("/api/inpatient-orders/\\d+") && "DELETE".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                InpatientOrder o = new InpatientOrder(); o.setId(id);
                o.setStatus("已作废");
                o.setStopTime(new java.sql.Timestamp(System.currentTimeMillis()));
                dao.update(o); sendResponse(exchange, "{\"success\":true}");
            }
        }
}
