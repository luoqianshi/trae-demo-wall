package bean;

import java.util.Date;

public class Registration {
    private int id;
    private int patientId;
    private String patientName;
    private int doctorId;
    private String doctorName;
    private String dept;
    private Date regTime;
    private java.math.BigDecimal regFee;
    private String regStatus;
    private String queueNo;
    private Date createTime;
    private String medicalRecordNo;

    public Registration() {}

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

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public Date getRegTime() { return regTime; }
    public void setRegTime(Date regTime) { this.regTime = regTime; }

    public java.math.BigDecimal getRegFee() { return regFee; }
    public void setRegFee(java.math.BigDecimal regFee) { this.regFee = regFee; }

    public String getRegStatus() { return regStatus; }
    public void setRegStatus(String regStatus) { this.regStatus = regStatus; }

    public String getQueueNo() { return queueNo; }
    public void setQueueNo(String queueNo) { this.queueNo = queueNo; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public String getMedicalRecordNo() { return medicalRecordNo; }
    public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
}
