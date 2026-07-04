package bean;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;

public class OutpatientMedicalRecord {
    private int id; private int patientId; private String patientName; private String medicalRecordNo;
    private String visitNo; private int doctorId; private String doctorName; private int deptId;
    private String deptName; private Date visitDate; private String visitType = "初诊";
    private String chiefComplaint; private String presentIllnessHistory; private String pastHistory;
    private String personalHistory; private String familyHistory; private String allergyHistory;
    private String physicalExam; private String auxiliaryExam; private String diagnosis;
    private String icdCode; private String treatmentPlan; private String advice; private Date nextVisitDate;
    private String status = "进行中"; private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getVisitNo() { return visitNo; } public void setVisitNo(String visitNo) { this.visitNo = visitNo; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public Date getVisitDate() { return visitDate; } public void setVisitDate(Date visitDate) { this.visitDate = visitDate; }
    public String getVisitType() { return visitType; } public void setVisitType(String visitType) { this.visitType = visitType; }
    public String getChiefComplaint() { return chiefComplaint; } public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }
    public String getPresentIllnessHistory() { return presentIllnessHistory; } public void setPresentIllnessHistory(String presentIllnessHistory) { this.presentIllnessHistory = presentIllnessHistory; }
    public String getPastHistory() { return pastHistory; } public void setPastHistory(String pastHistory) { this.pastHistory = pastHistory; }
    public String getPersonalHistory() { return personalHistory; } public void setPersonalHistory(String personalHistory) { this.personalHistory = personalHistory; }
    public String getFamilyHistory() { return familyHistory; } public void setFamilyHistory(String familyHistory) { this.familyHistory = familyHistory; }
    public String getAllergyHistory() { return allergyHistory; } public void setAllergyHistory(String allergyHistory) { this.allergyHistory = allergyHistory; }
    public String getPhysicalExam() { return physicalExam; } public void setPhysicalExam(String physicalExam) { this.physicalExam = physicalExam; }
    public String getAuxiliaryExam() { return auxiliaryExam; } public void setAuxiliaryExam(String auxiliaryExam) { this.auxiliaryExam = auxiliaryExam; }
    public String getDiagnosis() { return diagnosis; } public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    public String getIcdCode() { return icdCode; } public void setIcdCode(String icdCode) { this.icdCode = icdCode; }
    public String getTreatmentPlan() { return treatmentPlan; } public void setTreatmentPlan(String treatmentPlan) { this.treatmentPlan = treatmentPlan; }
    public String getAdvice() { return advice; } public void setAdvice(String advice) { this.advice = advice; }
    public Date getNextVisitDate() { return nextVisitDate; } public void setNextVisitDate(Date nextVisitDate) { this.nextVisitDate = nextVisitDate; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
