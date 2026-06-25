package bean;
import java.math.BigDecimal;
import java.sql.Timestamp;

public class PrescriptionEnhanced {
    private int id; private String prescriptionNo; private int patientId; private String patientName;
    private String medicalRecordNo; private String visitNo; private int doctorId; private String doctorName;
    private int deptId; private String deptName; private String prescriptionType = "西药";
    private String diagnosis; private Timestamp prescriptionDate; private BigDecimal totalAmount = BigDecimal.ZERO;
    private String status = "待审核"; private Integer reviewerId; private String reviewerName;
    private Timestamp reviewTime; private String reviewOpinion; private Integer dispenserId;
    private String dispenserName; private Timestamp dispenseTime;
    private int isEmergency = 0; private int isChronic = 0; private int validDays = 3;
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getPrescriptionNo() { return prescriptionNo; } public void setPrescriptionNo(String prescriptionNo) { this.prescriptionNo = prescriptionNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getVisitNo() { return visitNo; } public void setVisitNo(String visitNo) { this.visitNo = visitNo; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getPrescriptionType() { return prescriptionType; } public void setPrescriptionType(String prescriptionType) { this.prescriptionType = prescriptionType; }
    public String getDiagnosis() { return diagnosis; } public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    public Timestamp getPrescriptionDate() { return prescriptionDate; } public void setPrescriptionDate(Timestamp prescriptionDate) { this.prescriptionDate = prescriptionDate; }
    public BigDecimal getTotalAmount() { return totalAmount; } public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Integer getReviewerId() { return reviewerId; } public void setReviewerId(Integer reviewerId) { this.reviewerId = reviewerId; }
    public String getReviewerName() { return reviewerName; } public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
    public Timestamp getReviewTime() { return reviewTime; } public void setReviewTime(Timestamp reviewTime) { this.reviewTime = reviewTime; }
    public String getReviewOpinion() { return reviewOpinion; } public void setReviewOpinion(String reviewOpinion) { this.reviewOpinion = reviewOpinion; }
    public Integer getDispenserId() { return dispenserId; } public void setDispenserId(Integer dispenserId) { this.dispenserId = dispenserId; }
    public String getDispenserName() { return dispenserName; } public void setDispenserName(String dispenserName) { this.dispenserName = dispenserName; }
    public Timestamp getDispenseTime() { return dispenseTime; } public void setDispenseTime(Timestamp dispenseTime) { this.dispenseTime = dispenseTime; }
    public int getIsEmergency() { return isEmergency; } public void setIsEmergency(int isEmergency) { this.isEmergency = isEmergency; }
    public int getIsChronic() { return isChronic; } public void setIsChronic(int isChronic) { this.isChronic = isChronic; }
    public int getValidDays() { return validDays; } public void setValidDays(int validDays) { this.validDays = validDays; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
