package bean;

import java.util.Date;

public class TreatmentExecution {
    private int id; private String executionNo; private int orderId; private int patientId;
    private String patientName; private String treatmentName; private String treatmentType;
    private int deptId; private String deptName; private String treatmentLocation;
    private Date scheduledDate; private String scheduledTimeSlot;
    private Integer executorId; private String executorName;
    private Date executionDate; private Date executionStartTime; private Date executionEndTime;
    private String executionResult; private String patientFeedback; private String executionStatus;
    private String remark; private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getExecutionNo() { return executionNo; } public void setExecutionNo(String v) { this.executionNo = v; }
    public int getOrderId() { return orderId; } public void setOrderId(int v) { this.orderId = v; }
    public int getPatientId() { return patientId; } public void setPatientId(int v) { this.patientId = v; }
    public String getPatientName() { return patientName; } public void setPatientName(String v) { this.patientName = v; }
    public String getTreatmentName() { return treatmentName; } public void setTreatmentName(String v) { this.treatmentName = v; }
    public String getTreatmentType() { return treatmentType; } public void setTreatmentType(String v) { this.treatmentType = v; }
    public int getDeptId() { return deptId; } public void setDeptId(int v) { this.deptId = v; }
    public String getDeptName() { return deptName; } public void setDeptName(String v) { this.deptName = v; }
    public String getTreatmentLocation() { return treatmentLocation; } public void setTreatmentLocation(String v) { this.treatmentLocation = v; }
    public Date getScheduledDate() { return scheduledDate; } public void setScheduledDate(Date v) { this.scheduledDate = v; }
    public String getScheduledTimeSlot() { return scheduledTimeSlot; } public void setScheduledTimeSlot(String v) { this.scheduledTimeSlot = v; }
    public Integer getExecutorId() { return executorId; } public void setExecutorId(Integer v) { this.executorId = v; }
    public String getExecutorName() { return executorName; } public void setExecutorName(String v) { this.executorName = v; }
    public Date getExecutionDate() { return executionDate; } public void setExecutionDate(Date v) { this.executionDate = v; }
    public Date getExecutionStartTime() { return executionStartTime; } public void setExecutionStartTime(Date v) { this.executionStartTime = v; }
    public Date getExecutionEndTime() { return executionEndTime; } public void setExecutionEndTime(Date v) { this.executionEndTime = v; }
    public String getExecutionResult() { return executionResult; } public void setExecutionResult(String v) { this.executionResult = v; }
    public String getPatientFeedback() { return patientFeedback; } public void setPatientFeedback(String v) { this.patientFeedback = v; }
    public String getExecutionStatus() { return executionStatus; } public void setExecutionStatus(String v) { this.executionStatus = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}