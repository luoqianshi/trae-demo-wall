package bean;

import java.util.Date;

public class AuditLog {
    private long id;
    private Long operatorId;
    private String operatorName;
    private String action;
    private String targetType;
    private Long targetId;
    private Long patientId;
    private String moduleName;
    private String requestIp;
    private int success;
    private String summary;
    private String beforeValue;
    private String afterValue;
    private Date createdAt;

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }

    public Long getOperatorId() { return operatorId; }
    public void setOperatorId(Long operatorId) { this.operatorId = operatorId; }

    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }

    public String getRequestIp() { return requestIp; }
    public void setRequestIp(String requestIp) { this.requestIp = requestIp; }

    public int getSuccess() { return success; }
    public void setSuccess(int success) { this.success = success; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getBeforeValue() { return beforeValue; }
    public void setBeforeValue(String beforeValue) { this.beforeValue = beforeValue; }

    public String getAfterValue() { return afterValue; }
    public void setAfterValue(String afterValue) { this.afterValue = afterValue; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
