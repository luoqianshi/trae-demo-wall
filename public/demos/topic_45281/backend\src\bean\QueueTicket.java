package bean;

import java.util.Date;

public class QueueTicket {
    private int id;
    private String businessType;
    private int patientId;
    private String patientName;
    private String ticketNo;
    private int deptId;
    private String deptName;
    private String windowNo;
    private String status;
    private int priority;
    private int calledCount;
    private Date callTime;
    private Date startTime;
    private Date finishTime;
    private Integer waitMinutes;
    private Date createTime;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }
    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getTicketNo() { return ticketNo; }
    public void setTicketNo(String ticketNo) { this.ticketNo = ticketNo; }
    public int getDeptId() { return deptId; }
    public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getWindowNo() { return windowNo; }
    public void setWindowNo(String windowNo) { this.windowNo = windowNo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }
    public int getCalledCount() { return calledCount; }
    public void setCalledCount(int calledCount) { this.calledCount = calledCount; }
    public Date getCallTime() { return callTime; }
    public void setCallTime(Date callTime) { this.callTime = callTime; }
    public Date getStartTime() { return startTime; }
    public void setStartTime(Date startTime) { this.startTime = startTime; }
    public Date getFinishTime() { return finishTime; }
    public void setFinishTime(Date finishTime) { this.finishTime = finishTime; }
    public Integer getWaitMinutes() { return waitMinutes; }
    public void setWaitMinutes(Integer waitMinutes) { this.waitMinutes = waitMinutes; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
