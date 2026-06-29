package bean;
import java.math.BigDecimal;
import java.sql.Timestamp;

public class PathologyExamOrder {
    private int id; private String pathologyNo; private int patientId; private String patientName;
    private String medicalRecordNo; private String admissionNo;
    private int doctorId; private String doctorName; private int deptId; private String deptName;
    private String specimenSource; private String specimenType; private String specimenSite;
    private String clinicalDiagnosis; private String surgeryInfo; private String clinicalHistory;
    private String status = "已登记";
    private String grossDescription; private String microscopicDescription;
    private String pathologyDiagnosis; private String immunohistochemistry; private String molecularTest;
    private Integer pathologistId; private String pathologistName; private Timestamp reportTime;
    private int isUrgent = 0; private String urgentResult;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getPathologyNo() { return pathologyNo; } public void setPathologyNo(String pathologyNo) { this.pathologyNo = pathologyNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getSpecimenSource() { return specimenSource; } public void setSpecimenSource(String specimenSource) { this.specimenSource = specimenSource; }
    public String getSpecimenType() { return specimenType; } public void setSpecimenType(String specimenType) { this.specimenType = specimenType; }
    public String getSpecimenSite() { return specimenSite; } public void setSpecimenSite(String specimenSite) { this.specimenSite = specimenSite; }
    public String getClinicalDiagnosis() { return clinicalDiagnosis; } public void setClinicalDiagnosis(String clinicalDiagnosis) { this.clinicalDiagnosis = clinicalDiagnosis; }
    public String getSurgeryInfo() { return surgeryInfo; } public void setSurgeryInfo(String surgeryInfo) { this.surgeryInfo = surgeryInfo; }
    public String getClinicalHistory() { return clinicalHistory; } public void setClinicalHistory(String clinicalHistory) { this.clinicalHistory = clinicalHistory; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getGrossDescription() { return grossDescription; } public void setGrossDescription(String grossDescription) { this.grossDescription = grossDescription; }
    public String getMicroscopicDescription() { return microscopicDescription; } public void setMicroscopicDescription(String microscopicDescription) { this.microscopicDescription = microscopicDescription; }
    public String getPathologyDiagnosis() { return pathologyDiagnosis; } public void setPathologyDiagnosis(String pathologyDiagnosis) { this.pathologyDiagnosis = pathologyDiagnosis; }
    public String getImmunohistochemistry() { return immunohistochemistry; } public void setImmunohistochemistry(String immunohistochemistry) { this.immunohistochemistry = immunohistochemistry; }
    public String getMolecularTest() { return molecularTest; } public void setMolecularTest(String molecularTest) { this.molecularTest = molecularTest; }
    public Integer getPathologistId() { return pathologistId; } public void setPathologistId(Integer pathologistId) { this.pathologistId = pathologistId; }
    public String getPathologistName() { return pathologistName; } public void setPathologistName(String pathologistName) { this.pathologistName = pathologistName; }
    public Timestamp getReportTime() { return reportTime; } public void setReportTime(Timestamp reportTime) { this.reportTime = reportTime; }
    public int getIsUrgent() { return isUrgent; } public void setIsUrgent(int isUrgent) { this.isUrgent = isUrgent; }
    public String getUrgentResult() { return urgentResult; } public void setUrgentResult(String urgentResult) { this.urgentResult = urgentResult; }
    public BigDecimal getTotalAmount() { return totalAmount; } public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
