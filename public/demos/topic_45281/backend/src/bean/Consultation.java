package bean;

import java.util.Date;

public class Consultation {
    private int id;
    private int patientId;
    private String patientName;
    private int doctorId;
    private String doctorName;
    private String deptName;
    private String subject;
    private String status;
    private Date lastMessageTime;
    private Date closeTime;
    private Date createTime;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public int getDoctorId() { return doctorId; }
    public void setDoctorId(int doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Date getLastMessageTime() { return lastMessageTime; }
    public void setLastMessageTime(Date lastMessageTime) { this.lastMessageTime = lastMessageTime; }
    public Date getCloseTime() { return closeTime; }
    public void setCloseTime(Date closeTime) { this.closeTime = closeTime; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
