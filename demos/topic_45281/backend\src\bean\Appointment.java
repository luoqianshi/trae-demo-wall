package bean;

import java.math.BigDecimal;
import java.util.Date;

public class Appointment {
    private int id;
    private int patientId;
    private String patientName;
    private int doctorId;
    private String doctorName;
    private int deptId;
    private String deptName;
    private Date appointmentDate;
    private String timePeriod;
    private String appointmentNo;
    private String appointmentType;
    private String registrationLevel;
    private String status;
    private BigDecimal fee;
    private int isPaid;
    private String cancelReason;
    private Date createTime;
    private Date updateTime;

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
    public int getDeptId() { return deptId; }
    public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }
    public Date getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(Date appointmentDate) { this.appointmentDate = appointmentDate; }
    public String getTimePeriod() { return timePeriod; }
    public void setTimePeriod(String timePeriod) { this.timePeriod = timePeriod; }
    public String getAppointmentNo() { return appointmentNo; }
    public void setAppointmentNo(String appointmentNo) { this.appointmentNo = appointmentNo; }
    public String getAppointmentType() { return appointmentType; }
    public void setAppointmentType(String appointmentType) { this.appointmentType = appointmentType; }
    public String getRegistrationLevel() { return registrationLevel; }
    public void setRegistrationLevel(String registrationLevel) { this.registrationLevel = registrationLevel; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getFee() { return fee; }
    public void setFee(BigDecimal fee) { this.fee = fee; }
    public int getIsPaid() { return isPaid; }
    public void setIsPaid(int isPaid) { this.isPaid = isPaid; }
    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }
}
