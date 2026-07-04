package bean;

import java.util.Date;

public class OrderExecution {
    private int id; private String executionNo; private int orderId; private String orderType;
    private int patientId; private String patientName; private int deptId; private String deptName;
    private int doctorId; private String doctorName; private String executionType;
    private String executionStatus; private int executorId; private String executorName;
    private Date executionTime; private String executionResult; private String remark;
    private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getExecutionNo() { return executionNo; } public void setExecutionNo(String v) { this.executionNo = v; }
    public int getOrderId() { return orderId; } public void setOrderId(int v) { this.orderId = v; }
    public String getOrderType() { return orderType; } public void setOrderType(String v) { this.orderType = v; }
    public int getPatientId() { return patientId; } public void setPatientId(int v) { this.patientId = v; }
    public String getPatientName() { return patientName; } public void setPatientName(String v) { this.patientName = v; }
    public int getDeptId() { return deptId; } public void setDeptId(int v) { this.deptId = v; }
    public String getDeptName() { return deptName; } public void setDeptName(String v) { this.deptName = v; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int v) { this.doctorId = v; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String v) { this.doctorName = v; }
    public String getExecutionType() { return executionType; } public void setExecutionType(String v) { this.executionType = v; }
    public String getExecutionStatus() { return executionStatus; } public void setExecutionStatus(String v) { this.executionStatus = v; }
    public int getExecutorId() { return executorId; } public void setExecutorId(int v) { this.executorId = v; }
    public String getExecutorName() { return executorName; } public void setExecutorName(String v) { this.executorName = v; }
    public Date getExecutionTime() { return executionTime; } public void setExecutionTime(Date v) { this.executionTime = v; }
    public String getExecutionResult() { return executionResult; } public void setExecutionResult(String v) { this.executionResult = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}