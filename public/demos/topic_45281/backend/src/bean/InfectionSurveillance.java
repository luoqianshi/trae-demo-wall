package bean;
import java.sql.Timestamp;

public class InfectionSurveillance {
    private int id;
    private String surveillanceNo;
    private int patientId;
    private String patientName;
    private String medicalRecordNo;
    private String admissionNo;
    private int deptId;
    private String deptName;
    private String bedNo;
    private String infectionType;
    private String infectionSite;
    private java.sql.Date diagnosisDate;
    private String pathogen;
    private String sampleType;
    private String riskFactors;
    private String antibioticUse;
    private int reporterId;
    private String reporterName;
    private java.sql.Date reportDate;
    private Integer confirmDoctorId;
    private String confirmDoctorName;
    private java.sql.Date confirmDate;
    private String category;
    private String severity;
    private String outcome;
    private String status;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getSurveillanceNo() { return surveillanceNo; } public void setSurveillanceNo(String surveillanceNo) { this.surveillanceNo = surveillanceNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getBedNo() { return bedNo; } public void setBedNo(String bedNo) { this.bedNo = bedNo; }
    public String getInfectionType() { return infectionType; } public void setInfectionType(String infectionType) { this.infectionType = infectionType; }
    public String getInfectionSite() { return infectionSite; } public void setInfectionSite(String infectionSite) { this.infectionSite = infectionSite; }
    public java.sql.Date getDiagnosisDate() { return diagnosisDate; } public void setDiagnosisDate(java.sql.Date diagnosisDate) { this.diagnosisDate = diagnosisDate; }
    public String getPathogen() { return pathogen; } public void setPathogen(String pathogen) { this.pathogen = pathogen; }
    public String getSampleType() { return sampleType; } public void setSampleType(String sampleType) { this.sampleType = sampleType; }
    public String getRiskFactors() { return riskFactors; } public void setRiskFactors(String riskFactors) { this.riskFactors = riskFactors; }
    public String getAntibioticUse() { return antibioticUse; } public void setAntibioticUse(String antibioticUse) { this.antibioticUse = antibioticUse; }
    public int getReporterId() { return reporterId; } public void setReporterId(int reporterId) { this.reporterId = reporterId; }
    public String getReporterName() { return reporterName; } public void setReporterName(String reporterName) { this.reporterName = reporterName; }
    public java.sql.Date getReportDate() { return reportDate; } public void setReportDate(java.sql.Date reportDate) { this.reportDate = reportDate; }
    public Integer getConfirmDoctorId() { return confirmDoctorId; } public void setConfirmDoctorId(Integer confirmDoctorId) { this.confirmDoctorId = confirmDoctorId; }
    public String getConfirmDoctorName() { return confirmDoctorName; } public void setConfirmDoctorName(String confirmDoctorName) { this.confirmDoctorName = confirmDoctorName; }
    public java.sql.Date getConfirmDate() { return confirmDate; } public void setConfirmDate(java.sql.Date confirmDate) { this.confirmDate = confirmDate; }
    public String getCategory() { return category; } public void setCategory(String category) { this.category = category; }
    public String getSeverity() { return severity; } public void setSeverity(String severity) { this.severity = severity; }
    public String getOutcome() { return outcome; } public void setOutcome(String outcome) { this.outcome = outcome; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
