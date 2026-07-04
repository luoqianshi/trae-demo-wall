package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.NursingRecord;
import java.util.Map;
import java.math.BigDecimal;

public class NursingRecordHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.NursingRecordDAOImpl dao = new dao.impl.NursingRecordDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery(); int page=1,size=20; String type="";
                if (q!=null) for(String p:q.split("&")){String[]kv=p.split("=");if(kv.length==2){
                    if("page".equals(kv[0]))page=Integer.parseInt(kv[1]);else if("size".equals(kv[0]))size=Integer.parseInt(kv[1]);
                    else if("type".equals(kv[0]))type=kv[1];
                    else if("inpatientId".equals(kv[0])){
                        sendResponse(exchange,"{\"items\":"+dao.findByNursingInpatientId(Integer.parseInt(kv[1]))+"}");return;
                    }else if("id".equals(kv[0])){
                        NursingRecord nr=dao.findNursingById(Integer.parseInt(kv[1]));sendResponse(exchange,nr!=null?toJson(nr):"null");return;
                    }}
                }
                sendResponse(exchange, "{\"items\":"+dao.findAllNursingRecords(type,page,size)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                NursingRecord n = new NursingRecord();
                n.setInpatientId(getIntParam(params,"inpatientId"));n.setPatientId(getIntParam(params,"patientId"));
                n.setPatientName(params.get("patientName"));n.setAdmissionNo(params.get("admissionNo"));
                n.setBedNo(params.get("bedNo"));n.setRecordType(params.get("recordType"));
                n.setRecordTime(new java.sql.Timestamp(System.currentTimeMillis()));
                n.setRecordLevel(params.getOrDefault("recordLevel","一级护理"));
                n.setNurseId(getIntParam(params,"nurseId"));n.setNurseName(params.get("nurseName"));
                n.setVitalSigns(params.get("vitalSigns"));n.setConsciousness(params.get("consciousness"));
                n.setDiet(params.get("diet"));
                String ia=params.get("intakeAmount");n.setIntakeAmount(ia!=null&&!ia.isEmpty()?new java.math.BigDecimal(ia):null);
                String oa=params.get("outputAmount");n.setOutputAmount(oa!=null&&!oa.isEmpty()?new java.math.BigDecimal(oa):null);
                n.setConditionDescription(params.get("conditionDescription"));
                n.setNursingMeasures(params.get("nursingMeasures"));n.setHealthEducation(params.get("healthEducation"));
                n.setFallRiskScore(getIntParamOrNull(params,"fallRiskScore"));
                n.setPressureInjuryRiskScore(getIntParamOrNull(params,"pressureInjuryRiskScore"));
                n.setPainScore(getIntParamOrNull(params,"painScore"));n.setAdlScore(getIntParamOrNull(params,"adlScore"));
                n.setSignature(params.get("signature"));
                int id = dao.insert(n); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/nursing-records/\\d+") && "DELETE".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                dao.deleteNursing(id); sendResponse(exchange, "{\"success\":true}");
            }
        }
}
