package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.MedicalQualityControl;
import java.util.Map;
import java.util.Date;

public class QualityControlHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.MedicalQualityControlDAOImpl dao = new dao.impl.MedicalQualityControlDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery(); int page=1,size=20; String targetType="", result="";
                if (q!=null) for(String p:q.split("&")){String[]kv=p.split("=");if(kv.length==2){
                    if("page".equals(kv[0]))page=Integer.parseInt(kv[1]);else if("size".equals(kv[0]))size=Integer.parseInt(kv[1]);
                    else if("targetType".equals(kv[0]))targetType=kv[1];else if("result".equals(kv[0]))result=kv[1];
                    else if("id".equals(kv[0])){
                        MedicalQualityControl qc=dao.findQCById(Integer.parseInt(kv[1]));sendResponse(exchange,qc!=null?toJson(qc):"null");return;
                    }}
                }
                sendResponse(exchange, "{\"items\":"+dao.findAllQCRecords(targetType,result,page,size)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                MedicalQualityControl qc = new MedicalQualityControl();
                qc.setQcType(params.getOrDefault("qcType","时限质控"));qc.setTargetType(params.get("targetType"));
                qc.setTargetId(getIntParam(params,"targetId"));qc.setTargetNo(params.get("targetNo"));
                qc.setPatientId(getIntParamOrNull(params,"patientId"));qc.setPatientName(params.get("patientName"));
                qc.setDoctorId(getIntParamOrNull(params,"doctorId"));qc.setDoctorName(params.get("doctorName"));
                qc.setDeptId(getIntParamOrNull(params,"deptId"));qc.setDeptName(params.get("deptName"));
                qc.setQcItem(params.get("qcItem"));qc.setQcStandard(params.get("qcStandard"));
                qc.setActualValue(params.get("actualValue"));qc.setStandardValue(params.get("standardValue"));
                qc.setResult(params.getOrDefault("result","不合格"));qc.setScore(getIntParamOrNull(params,"score"));
                qc.setProblemDescription(params.get("problemDescription"));qc.setSuggestion(params.get("suggestion"));
                qc.setQcPersonId(getIntParam(params,"qcPersonId"));qc.setQcPersonName(params.get("qcPersonName"));
                qc.setQcTime(new java.sql.Timestamp(System.currentTimeMillis()));
                String rd=params.get("rectifyDeadline");
                qc.setRectifyDeadline(rd!=null&&!rd.isEmpty()?java.sql.Date.valueOf(rd):null);
                int id = dao.insert(qc); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/quality-control/\\d+") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                Map<String,String> params = parseJson(getRequestBody(exchange));
                MedicalQualityControl qc = new MedicalQualityControl(); qc.setId(id);
                qc.setResult(params.get("result"));qc.setScore(getIntParamOrNull(params,"score"));
                qc.setProblemDescription(params.get("problemDescription"));qc.setSuggestion(params.get("suggestion"));
                qc.setRectifyStatus(params.get("rectifyStatus"));qc.setRectifyResult(params.get("rectifyResult"));
                qc.setVerifyPersonId(getIntParamOrNull(params,"verifyPersonId"));qc.setVerifyPersonName(params.get("verifyPersonName"));
                if("已完成".equals(params.get("rectifyStatus")))qc.setVerifyTime(new java.sql.Timestamp(System.currentTimeMillis()));
                dao.updateQC(qc); sendResponse(exchange, "{\"success\":true}");
            } else if (path.matches("/api/medical-quality-control/\\d+") && "DELETE".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                MedicalQualityControl qc = new MedicalQualityControl(); qc.setId(id);
                qc.setResult("已作废"); dao.updateQC(qc); sendResponse(exchange, "{\"success\":true}");
            }
        }
}
