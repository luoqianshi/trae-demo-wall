package bean;

import java.math.BigDecimal;
import java.util.Date;

public class Surgery {
    private int id;
    private int patientId;
    private String patientName;
    private String surgeryName;
    private String surgeryType;
    private String dept;
    private int doctorId;
    private String doctorName;
    private Date surgeryTime;
    private Date surgeryDate;
    private String surgeryRoom;
    private String surgeonName;
    private String anesthesiaType;
    private String anesthesiaDoctor;
    private String status;
    private String diagnosis;
    private String remark;
    private int duration;
    private BigDecimal surgeryFee;
    private BigDecimal anesthesiaFee;
    private Date createTime;

    public Surgery() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getSurgeryName() { return surgeryName; }
    public void setSurgeryName(String surgeryName) { this.surgeryName = surgeryName; }

    public String getSurgeryType() { return surgeryType; }
    public void setSurgeryType(String surgeryType) { this.surgeryType = surgeryType; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public int getDoctorId() { return doctorId; }
    public void setDoctorId(int doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public Date getSurgeryTime() { return surgeryTime; }
    public void setSurgeryTime(Date surgeryTime) { this.surgeryTime = surgeryTime; }

    public Date getSurgeryDate() { return surgeryDate; }
    public void setSurgeryDate(Date surgeryDate) { this.surgeryDate = surgeryDate; }

    public String getSurgeryRoom() { return surgeryRoom; }
    public void setSurgeryRoom(String surgeryRoom) { this.surgeryRoom = surgeryRoom; }

    public String getSurgeonName() { return surgeonName; }
    public void setSurgeonName(String surgeonName) { this.surgeonName = surgeonName; }

    public String getAnesthesiaType() { return anesthesiaType; }
    public void setAnesthesiaType(String anesthesiaType) { this.anesthesiaType = anesthesiaType; }

    public String getAnesthesiaDoctor() { return anesthesiaDoctor; }
    public void setAnesthesiaDoctor(String anesthesiaDoctor) { this.anesthesiaDoctor = anesthesiaDoctor; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public BigDecimal getSurgeryFee() { return surgeryFee; }
    public void setSurgeryFee(BigDecimal surgeryFee) { this.surgeryFee = surgeryFee; }

    public BigDecimal getAnesthesiaFee() { return anesthesiaFee; }
    public void setAnesthesiaFee(BigDecimal anesthesiaFee) { this.anesthesiaFee = anesthesiaFee; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
