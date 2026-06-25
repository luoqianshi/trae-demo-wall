package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Notification;
import java.util.Map;

public class NotificationHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();
            dao.impl.NotificationDAOImpl dao = new dao.impl.NotificationDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery(); String type="全体"; int targetId=0,unreadOnly=0,page=1,size=20;
                if (q!=null) for(String p:q.split("&")){String[]kv=p.split("=");if(kv.length==2){
                    if("targetType".equals(kv[0]))type=kv[1];else if("targetId".equals(kv[0]))targetId=Integer.parseInt(kv[1]);
                    else if("unreadOnly".equals(kv[0]))unreadOnly=Integer.parseInt(kv[1]);else if("page".equals(kv[0]))page=Integer.parseInt(kv[1]);else if("size".equals(kv[0]))size=Integer.parseInt(kv[1]);
                    else if("userId".equals(kv[0])){int c=dao.countUnread(Integer.parseInt(kv[1]));sendResponse(exchange,"{\"unreadCount\":"+c+"}");return;}
                }}
                sendResponse(exchange, "{\"items\":"+dao.findByTarget(type,targetId,unreadOnly,page,size)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                Notification n = new Notification();
                n.setTitle(params.get("title")); n.setContent(params.get("content"));
                n.setNotifyType(params.get("notifyType")); n.setTargetType(params.get("targetType"));
                n.setTargetId(getIntParam(params,"targetId")); n.setTargetName(params.get("targetName"));
                n.setSendChannel(params.get("sendChannel"));
                int id = dao.insert(n); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/notifications/\\d+/read") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.split("/")[3]);
                String q = exchange.getRequestURI().getQuery(); int userId=0;
                if(q!=null)for(String p:q.split("&")){String[]kv=p.split("=");if("userId".equals(kv[0])&&kv.length==2)userId=Integer.parseInt(kv[1]);}
                dao.markRead(id,userId); sendResponse(exchange, "{\"success\":true}");
            }
        }
}
