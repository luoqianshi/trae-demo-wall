package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.SatisfactionEvaluation;
import java.util.Map;

public class EvaluationHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.SatisfactionEvaluationDAOImpl dao = new dao.impl.SatisfactionEvaluationDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery(); String type=null; int page=1,size=20;
                if (q!=null) for(String p:q.split("&")){String[]kv=p.split("=");if(kv.length==2){if("type".equals(kv[0]))type=kv[1];else if("page".equals(kv[0]))page=Integer.parseInt(kv[1]);else if("size".equals(kv[0]))size=Integer.parseInt(kv[1]);}}
                sendResponse(exchange, "{\"items\":"+dao.findAll(type,page,size)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                SatisfactionEvaluation e = new SatisfactionEvaluation();
                e.setPatientId(getIntParam(params,"patientId")); e.setPatientName(params.get("patientName"));
                e.setEvaluateType(params.get("evaluateType")); e.setTargetId(getIntParam(params,"targetId"));
                e.setTargetName(params.get("targetName")); e.setOverallScore(getIntParam(params,"overallScore"));
                e.setAttitudeScore(getIntParamOrNull(params,"attitudeScore")); e.setSkillScore(getIntParamOrNull(params,"skillScore"));
                e.setEfficiencyScore(getIntParamOrNull(params,"efficiencyScore")); e.setEnvironmentScore(getIntParamOrNull(params,"environmentScore"));
                e.setCommentText(params.get("commentText")); e.setIsAnonymous(getIntParam(params,"isAnonymous"));
                int id = dao.insert(e); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/evaluations/\\d+/reply") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.split("/")[3]);
                Map<String,String> params = parseJson(getRequestBody(exchange));
                dao.reply(id, params.get("replyText"), params.get("replyBy"));
                sendResponse(exchange, "{\"success\":true}");
            }
        }
}
