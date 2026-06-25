package bean;
import java.sql.Timestamp;
import java.math.BigDecimal;

public class QualityControlCheck {
    private int id;
    private String checkNo;
    private String checkType;
    private int deptId;
    private String deptName;
    private int patientId;
    private String patientName;
    private String medicalRecordNo;
    private String admissionNo;
    private int checkerId;
    private String checkerName;
    private java.sql.Date checkDate;
    private String checkItems;
    private BigDecimal score;
    private BigDecimal totalScore;
    private int passFlag;
    private String problemDesc;
    private String improveRequire;
    private java.sql.Date improveDeadline;
    private String status;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getCheckNo() { return checkNo; } public void setCheckNo(String checkNo) { this.checkNo = checkNo; }
    public String getCheckType() { return checkType; } public void setCheckType(String checkType) { this.checkType = checkType; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public int getCheckerId() { return checkerId; } public void setCheckerId(int checkerId) { this.checkerId = checkerId; }
    public String getCheckerName() { return checkerName; } public void setCheckerName(String checkerName) { this.checkerName = checkerName; }
    public java.sql.Date getCheckDate() { return checkDate; } public void setCheckDate(java.sql.Date checkDate) { this.checkDate = checkDate; }
    public String getCheckItems() { return checkItems; } public void setCheckItems(String checkItems) { this.checkItems = checkItems; }
    public BigDecimal getScore() { return score; } public void setScore(BigDecimal score) { this.score = score; }
    public BigDecimal getTotalScore() { return totalScore; } public void setTotalScore(BigDecimal totalScore) { this.totalScore = totalScore; }
    public int getPassFlag() { return passFlag; } public void setPassFlag(int passFlag) { this.passFlag = passFlag; }
    public String getProblemDesc() { return problemDesc; } public void setProblemDesc(String problemDesc) { this.problemDesc = problemDesc; }
    public String getImproveRequire() { return improveRequire; } public void setImproveRequire(String improveRequire) { this.improveRequire = improveRequire; }
    public java.sql.Date getImproveDeadline() { return improveDeadline; } public void setImproveDeadline(java.sql.Date improveDeadline) { this.improveDeadline = improveDeadline; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
