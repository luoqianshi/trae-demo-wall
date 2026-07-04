package dao.impl;

import bean.AuditLog;
import dao.AuditLogDAO;
import util.JDBCUtil;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AuditLogDAOImpl implements AuditLogDAO {
    @Override
    public int insert(AuditLog log) {
        return JDBCUtil.executeInsert(
            "INSERT INTO audit_log(operator_id,operator_name,action,target_type,target_id,patient_id,module_name,request_ip,success,summary,before_value,after_value) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            log.getOperatorId(),
            log.getOperatorName(),
            log.getAction(),
            log.getTargetType(),
            log.getTargetId(),
            log.getPatientId(),
            log.getModuleName(),
            log.getRequestIp(),
            log.getSuccess(),
            log.getSummary(),
            log.getBeforeValue(),
            log.getAfterValue()
        );
    }

    @Override
    public List<AuditLog> find(Map<String, String> params, int offset, int limit) {
        QueryParts parts = buildWhere(params);
        parts.sql.append(" ORDER BY created_at DESC LIMIT ? OFFSET ?");
        parts.args.add(limit);
        parts.args.add(offset);
        List<AuditLog> list = new ArrayList<>();
        JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(parts.sql.toString(), parts.args.toArray());
        try {
            if (qr != null) {
                ResultSet rs = qr.getResultSet();
                while (rs.next()) list.add(map(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (qr != null) qr.close();
        }
        return list;
    }

    @Override
    public int count(Map<String, String> params) {
        QueryParts parts = buildWhere(params);
        String countSql = parts.sql.toString().replace("SELECT *", "SELECT COUNT(*)");
        JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(countSql, parts.args.toArray());
        try {
            if (qr != null && qr.getResultSet().next()) return qr.getResultSet().getInt(1);
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (qr != null) qr.close();
        }
        return 0;
    }

    private QueryParts buildWhere(Map<String, String> params) {
        QueryParts parts = new QueryParts();
        parts.sql.append("SELECT * FROM audit_log WHERE 1=1");
        appendEquals(parts, params, "patientId", "patient_id");
        appendEquals(parts, params, "operatorId", "operator_id");
        appendEquals(parts, params, "targetId", "target_id");
        appendEquals(parts, params, "action", "action");
        appendEquals(parts, params, "targetType", "target_type");
        appendEquals(parts, params, "moduleName", "module_name");
        String keyword = params == null ? null : params.get("keyword");
        if (keyword != null && !keyword.trim().isEmpty()) {
            parts.sql.append(" AND (summary LIKE ? OR operator_name LIKE ? OR action LIKE ?)");
            String like = "%" + keyword.trim() + "%";
            parts.args.add(like);
            parts.args.add(like);
            parts.args.add(like);
        }
        return parts;
    }

    private void appendEquals(QueryParts parts, Map<String, String> params, String key, String column) {
        if (params == null) return;
        String value = params.get(key);
        if (value != null && !value.trim().isEmpty()) {
            parts.sql.append(" AND ").append(column).append("=?");
            parts.args.add(value.trim());
        }
    }

    private AuditLog map(ResultSet rs) throws SQLException {
        AuditLog log = new AuditLog();
        log.setId(rs.getLong("id"));
        long operatorId = rs.getLong("operator_id");
        log.setOperatorId(rs.wasNull() ? null : operatorId);
        log.setOperatorName(rs.getString("operator_name"));
        log.setAction(rs.getString("action"));
        log.setTargetType(rs.getString("target_type"));
        long targetId = rs.getLong("target_id");
        log.setTargetId(rs.wasNull() ? null : targetId);
        long patientId = rs.getLong("patient_id");
        log.setPatientId(rs.wasNull() ? null : patientId);
        log.setModuleName(rs.getString("module_name"));
        log.setRequestIp(rs.getString("request_ip"));
        log.setSuccess(rs.getInt("success"));
        log.setSummary(rs.getString("summary"));
        log.setBeforeValue(rs.getString("before_value"));
        log.setAfterValue(rs.getString("after_value"));
        log.setCreatedAt(rs.getTimestamp("created_at"));
        return log;
    }

    private static class QueryParts {
        StringBuilder sql = new StringBuilder();
        List<Object> args = new ArrayList<>();
    }
}
