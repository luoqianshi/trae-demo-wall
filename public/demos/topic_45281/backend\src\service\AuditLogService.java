package service;

import bean.AuditLog;
import dao.impl.AuditLogDAOImpl;
import util.JDBCUtil;

import java.util.List;
import java.util.Map;

public class AuditLogService {
    private final AuditLogDAOImpl dao = new AuditLogDAOImpl();

    public AuditLogService() {
        ensureTables();
    }

    public int record(AuditLog log) {
        if (log == null) return -1;
        if (log.getAction() == null || log.getAction().trim().isEmpty()) log.setAction("unknown");
        if (log.getModuleName() == null || log.getModuleName().trim().isEmpty()) log.setModuleName("HIS");
        return dao.insert(log);
    }

    public int record(String action, String targetType, Long targetId, Long patientId, String moduleName,
                      String operatorName, String requestIp, boolean success, String summary) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setPatientId(patientId);
        log.setModuleName(moduleName);
        log.setOperatorName(operatorName);
        log.setRequestIp(requestIp);
        log.setSuccess(success ? 1 : 0);
        log.setSummary(summary);
        return record(log);
    }

    public List<AuditLog> find(Map<String, String> params, int offset, int limit) {
        if (offset < 0) offset = 0;
        if (limit <= 0 || limit > 200) limit = 50;
        return dao.find(params, offset, limit);
    }

    public int count(Map<String, String> params) {
        return dao.count(params);
    }

    private void ensureTables() {
        JDBCUtil.executeUpdate(
            "CREATE TABLE IF NOT EXISTS audit_log (" +
            "id BIGINT PRIMARY KEY AUTO_INCREMENT," +
            "operator_id BIGINT," +
            "operator_name VARCHAR(100)," +
            "action VARCHAR(80) NOT NULL," +
            "target_type VARCHAR(80)," +
            "target_id BIGINT," +
            "patient_id BIGINT," +
            "module_name VARCHAR(80)," +
            "request_ip VARCHAR(100)," +
            "success TINYINT DEFAULT 1," +
            "summary VARCHAR(1000)," +
            "before_value TEXT," +
            "after_value TEXT," +
            "created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
            "INDEX idx_audit_operator (operator_id, created_at)," +
            "INDEX idx_audit_target (target_type, target_id)," +
            "INDEX idx_audit_patient (patient_id, created_at)," +
            "INDEX idx_audit_action (action, created_at)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }
}
