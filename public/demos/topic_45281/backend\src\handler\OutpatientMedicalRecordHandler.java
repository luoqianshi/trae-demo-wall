package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.OutpatientMedicalRecord;
import bean.PhysicalExam;
import java.util.Map;
import java.util.Date;

public class OutpatientMedicalRecordHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.OutpatientMedicalRecordDAOImpl dao = new dao.impl.OutpatientMedicalRecordDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery(); int page=1,size=20; String status="";
                if (q!=null) for(String p:q.split("&")){String[]kv=p.split("=");if(kv.length==2){
                    if("page".equals(kv[0]))page=Integer.parseInt(kv[1]);else if("size".equals(kv[0]))size=Integer.parseInt(kv[1]);
                    else if("status".equals(kv[0]))status=kv[1];else if("patientId".equals(kv[0])){
                        sendResponse(exchange,"{\"items\":"+dao.findByPatientId(Integer.parseInt(kv[1]))+"}");return;
                    }else if("doctorId".equals(kv[0])){
                        sendResponse(exchange,"{\"items\":"+dao.findByDoctorId(Integer.parseInt(kv[1]))+"}");return;
                    }else if("id".equals(kv[0])){
                        OutpatientMedicalRecord r=dao.findById(Integer.parseInt(kv[1]));sendResponse(exchange,r!=null?toJson(r):"null");return;
                    }}
                }
                String mrStatus = status!=null && !status.isEmpty()?status:null;
                sendResponse(exchange, "{\"items\":"+dao.findAll(mrStatus,page,size)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                OutpatientMedicalRecord r = new OutpatientMedicalRecord();
                r.setPatientId(getIntParam(params,"patientId"));r.setPatientName(params.get("patientName"));
                r.setMedicalRecordNo(params.get("medicalRecordNo"));r.setVisitNo(params.get("visitNo"));
                r.setDoctorId(getIntParam(params,"doctorId"));r.setDoctorName(params.get("doctorName"));
                r.setDeptId(getIntParam(params,"deptId"));r.setDeptName(params.get("deptName"));
                r.setVisitDate(java.sql.Date.valueOf(params.getOrDefault("visitDate",java.time.LocalDate.now().toString())));
                r.setVisitType(params.get("visitType"));r.setChiefComplaint(params.get("chiefComplaint"));
                r.setPresentIllnessHistory(params.get("presentIllnessHistory"));r.setPastHistory(params.get("pastHistory"));
                r.setPersonalHistory(params.get("personalHistory"));r.setFamilyHistory(params.get("familyHistory"));
                r.setAllergyHistory(params.get("allergyHistory"));r.setPhysicalExam(params.get("physicalExam"));
                r.setAuxiliaryExam(params.get("auxiliaryExam"));r.setDiagnosis(params.get("diagnosis"));
                r.setIcdCode(params.get("icdCode"));r.setTreatmentPlan(params.get("treatmentPlan"));
                r.setAdvice(params.get("advice"));r.setStatus(params.get("status"));
                int id = dao.insert(r); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/outpatient-medical-records/\\d+") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                Map<String,String> params = parseJson(getRequestBody(exchange));
                OutpatientMedicalRecord r = new OutpatientMedicalRecord(); r.setId(id);
                r.setChiefComplaint(params.get("chiefComplaint"));r.setPresentIllnessHistory(params.get("presentIllnessHistory"));
                r.setPastHistory(params.get("pastHistory"));r.setPhysicalExam(params.get("physicalExam"));
                r.setAuxiliaryExam(params.get("auxiliaryExam"));r.setDiagnosis(params.get("diagnosis"));
                r.setTreatmentPlan(params.get("treatmentPlan"));r.setAdvice(params.get("advice"));
                r.setStatus(params.get("status")); dao.update(r); sendResponse(exchange, "{\"success\":true}");
            } else if (path.matches("/api/outpatient-medical-records/\\d+") && "DELETE".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                OutpatientMedicalRecord r = new OutpatientMedicalRecord(); r.setId(id);
                r.setStatus("已作废"); dao.update(r); sendResponse(exchange, "{\"success\":true}");
            }
        }
}
