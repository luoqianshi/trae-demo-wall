package bean;
import java.sql.Timestamp;

public class InfectiousDiseaseReport {
    private int id;
    private String reportNo;
    private String diseaseCode;
    private String diseaseName;
    private String diseaseCategory;
    private int patientId;
    private String patientName;
    private String gender;
    private Integer age;
    private String idCard;
    private String phone;
    private String address;
    private String workplace;
    private java.sql.Date diagnosisDate;
    private java.sql.Date deathDate;
    private java.sql.Date onsetDate;
    private String symptoms;
    private String labResults;
    private String epidemiologyInfo;
    private String closeContacts;
    private int reporterId;
    private String reporterName;
    private Timestamp reportTime;
    private int deptId;
    private String deptName;
    private Timestamp cdcNotifyTime;
    private String cdcFeedback;
    private String status;
    private String urgentLevel;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getReportNo() { return reportNo; } public void setReportNo(String reportNo) { this.reportNo = reportNo; }
    public String getDiseaseCode() { return diseaseCode; } public void setDiseaseCode(String diseaseCode) { this.diseaseCode = diseaseCode; }
    public String getDiseaseName() { return diseaseName; } public void setDiseaseName(String diseaseName) { this.diseaseName = diseaseName; }
    public String getDiseaseCategory() { return diseaseCategory; } public void setDiseaseCategory(String diseaseCategory) { this.diseaseCategory = diseaseCategory; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getGender() { return gender; } public void setGender(String gender) { this.gender = gender; }
    public Integer getAge() { return age; } public void setAge(Integer age) { this.age = age; }
    public String getIdCard() { return idCard; } public void setIdCard(String idCard) { this.idCard = idCard; }
    public String getPhone() { return phone; } public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; } public void setAddress(String address) { this.address = address; }
    public String getWorkplace() { return workplace; } public void setWorkplace(String workplace) { this.workplace = workplace; }
    public java.sql.Date getDiagnosisDate() { return diagnosisDate; } public void setDiagnosisDate(java.sql.Date diagnosisDate) { this.diagnosisDate = diagnosisDate; }
    public java.sql.Date getDeathDate() { return deathDate; } public void setDeathDate(java.sql.Date deathDate) { this.deathDate = deathDate; }
    public java.sql.Date getOnsetDate() { return onsetDate; } public void setOnsetDate(java.sql.Date onsetDate) { this.onsetDate = onsetDate; }
    public String getSymptoms() { return symptoms; } public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
    public String getLabResults() { return labResults; } public void setLabResults(String labResults) { this.labResults = labResults; }
    public String getEpidemiologyInfo() { return epidemiologyInfo; } public void setEpidemiologyInfo(String epidemiologyInfo) { this.epidemiologyInfo = epidemiologyInfo; }
    public String getCloseContacts() { return closeContacts; } public void setCloseContacts(String closeContacts) { this.closeContacts = closeContacts; }
    public int getReporterId() { return reporterId; } public void setReporterId(int reporterId) { this.reporterId = reporterId; }
    public String getReporterName() { return reporterName; } public void setReporterName(String reporterName) { this.reporterName = reporterName; }
    public Timestamp getReportTime() { return reportTime; } public void setReportTime(Timestamp reportTime) { this.reportTime = reportTime; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public Timestamp getCdcNotifyTime() { return cdcNotifyTime; } public void setCdcNotifyTime(Timestamp cdcNotifyTime) { this.cdcNotifyTime = cdcNotifyTime; }
    public String getCdcFeedback() { return cdcFeedback; } public void setCdcFeedback(String cdcFeedback) { this.cdcFeedback = cdcFeedback; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getUrgentLevel() { return urgentLevel; } public void setUrgentLevel(String urgentLevel) { this.urgentLevel = urgentLevel; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
