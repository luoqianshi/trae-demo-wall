package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.PublicInfo;
import java.util.Map;

public class PublicInfoHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.PublicInfoDAOImpl dao = new dao.impl.PublicInfoDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery(); String category=null; int page=1,size=20;
                if (q!=null) for(String p:q.split("&")){String[]kv=p.split("=");if(kv.length==2){
                    if("category".equals(kv[0]))category=kv[1];else if("page".equals(kv[0]))page=Integer.parseInt(kv[1]);else if("size".equals(kv[0]))size=Integer.parseInt(kv[1]);
                    else if("id".equals(kv[0])){PublicInfo info=dao.findById(Integer.parseInt(kv[1]));if(info!=null)dao.incrementView(info.getId());sendResponse(exchange,toJson(info));return;}
                }}
                sendResponse(exchange, "{\"items\":"+dao.findByCategory(category,page,size)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                PublicInfo p = new PublicInfo();
                p.setTitle(params.get("title")); p.setCategory(params.get("category"));
                p.setContent(params.get("content")); p.setSummary(params.get("summary"));
                p.setAuthor(params.get("author")); p.setIsPublished(getIntParam(params,"isPublished"));
                int id = dao.insert(p); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/public-info/\\d+") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                Map<String,String> params = parseJson(getRequestBody(exchange));
                PublicInfo p = new PublicInfo(); p.setId(id);
                p.setTitle(params.get("title")); p.setCategory(params.get("category"));
                p.setContent(params.get("content")); p.setSummary(params.get("summary"));
                p.setIsPublished(getIntParam(params,"isPublished"));
                dao.update(p); sendResponse(exchange, "{\"success\":true}");
            } else if (path.matches("/api/public-info/\\d+") && "DELETE".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1)); dao.delete(id);
                sendResponse(exchange, "{\"success\":true}");
            }
        }
}
