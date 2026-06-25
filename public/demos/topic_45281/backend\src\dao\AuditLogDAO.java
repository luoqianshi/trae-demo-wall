package dao;

import bean.AuditLog;
import java.util.List;
import java.util.Map;

public interface AuditLogDAO {
    int insert(AuditLog log);
    List<AuditLog> find(Map<String, String> params, int offset, int limit);
    int count(Map<String, String> params);
}
