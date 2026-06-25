package bean;

import java.math.BigDecimal;
import java.util.Date;

public class TriageQueue {
    private int id; private int registrationId; private int patientId; private String patientName;
    private String patientGender; private int patientAge; private int deptId; private String deptName;
    private int doctorId; private String doctorName; private String queueNo; private String queueType;
    private int priority; private String source; private String status; private int callCount;
    private Date firstCallTime; private Date lastCallTime; private Date consultationStartTime;
    private Date consultationEndTime; private int waitingDuration; private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public int getRegistrationId() { return registrationId; } public void setRegistrationId(int v) { this.registrationId = v; }
    public int getPatientId() { return patientId; } public void setPatientId(int v) { this.patientId = v; }
    public String getPatientName() { return patientName; } public void setPatientName(String v) { this.patientName = v; }
    public String getPatientGender() { return patientGender; } public void setPatientGender(String v) { this.patientGender = v; }
    public int getPatientAge() { return patientAge; } public void setPatientAge(int v) { this.patientAge = v; }
    public int getDeptId() { return deptId; } public void setDeptId(int v) { this.deptId = v; }
    public String getDeptName() { return deptName; } public void setDeptName(String v) { this.deptName = v; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int v) { this.doctorId = v; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String v) { this.doctorName = v; }
    public String getQueueNo() { return queueNo; } public void setQueueNo(String v) { this.queueNo = v; }
    public String getQueueType() { return queueType; } public void setQueueType(String v) { this.queueType = v; }
    public int getPriority() { return priority; } public void setPriority(int v) { this.priority = v; }
    public String getSource() { return source; } public void setSource(String v) { this.source = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public int getCallCount() { return callCount; } public void setCallCount(int v) { this.callCount = v; }
    public Date getFirstCallTime() { return firstCallTime; } public void setFirstCallTime(Date v) { this.firstCallTime = v; }
    public Date getLastCallTime() { return lastCallTime; } public void setLastCallTime(Date v) { this.lastCallTime = v; }
    public Date getConsultationStartTime() { return consultationStartTime; } public void setConsultationStartTime(Date v) { this.consultationStartTime = v; }
    public Date getConsultationEndTime() { return consultationEndTime; } public void setConsultationEndTime(Date v) { this.consultationEndTime = v; }
    public int getWaitingDuration() { return waitingDuration; } public void setWaitingDuration(int v) { this.waitingDuration = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}