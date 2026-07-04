package bean;
import java.sql.Date;
import java.sql.Timestamp;

public class MedicalQualityControl {
    private int id; private String qcType; private String targetType; private int targetId;
    private String targetNo; private Integer patientId; private String patientName;
    private Integer doctorId; private String doctorName; private Integer deptId;
    private String deptName; private String qcItem; private String qcStandard;
    private String actualValue; private String standardValue;
    private String result; private Integer score; private int fullScore = 100;
    private String problemDescription; private String suggestion;
    private int qcPersonId; private String qcPersonName; private Timestamp qcTime;
    private Date rectifyDeadline; private String rectifyStatus = "待整改";
    private String rectifyResult; private Integer verifyPersonId; private String verifyPersonName;
    private Timestamp verifyTime; private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getQcType() { return qcType; } public void setQcType(String qcType) { this.qcType = qcType; }
    public String getTargetType() { return targetType; } public void setTargetType(String targetType) { this.targetType = targetType; }
    public int getTargetId() { return targetId; } public void setTargetId(int targetId) { this.targetId = targetId; }
    public String getTargetNo() { return targetNo; } public void setTargetNo(String targetNo) { this.targetNo = targetNo; }
    public Integer getPatientId() { return patientId; } public void setPatientId(Integer patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public Integer getDoctorId() { return doctorId; } public void setDoctorId(Integer doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public Integer getDeptId() { return deptId; } public void setDeptId(Integer deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getQcItem() { return qcItem; } public void setQcItem(String qcItem) { this.qcItem = qcItem; }
    public String getQcStandard() { return qcStandard; } public void setQcStandard(String qcStandard) { this.qcStandard = qcStandard; }
    public String getActualValue() { return actualValue; } public void setActualValue(String actualValue) { this.actualValue = actualValue; }
    public String getStandardValue() { return standardValue; } public void setStandardValue(String standardValue) { this.standardValue = standardValue; }
    public String getResult() { return result; } public void setResult(String result) { this.result = result; }
    public Integer getScore() { return score; } public void setScore(Integer score) { this.score = score; }
    public int getFullScore() { return fullScore; } public void setFullScore(int fullScore) { this.fullScore = fullScore; }
    public String getProblemDescription() { return problemDescription; } public void setProblemDescription(String problemDescription) { this.problemDescription = problemDescription; }
    public String getSuggestion() { return suggestion; } public void setSuggestion(String suggestion) { this.suggestion = suggestion; }
    public int getQcPersonId() { return qcPersonId; } public void setQcPersonId(int qcPersonId) { this.qcPersonId = qcPersonId; }
    public String getQcPersonName() { return qcPersonName; } public void setQcPersonName(String qcPersonName) { this.qcPersonName = qcPersonName; }
    public Timestamp getQcTime() { return qcTime; } public void setQcTime(Timestamp qcTime) { this.qcTime = qcTime; }
    public Date getRectifyDeadline() { return rectifyDeadline; } public void setRectifyDeadline(Date rectifyDeadline) { this.rectifyDeadline = rectifyDeadline; }
    public String getRectifyStatus() { return rectifyStatus; } public void setRectifyStatus(String rectifyStatus) { this.rectifyStatus = rectifyStatus; }
    public String getRectifyResult() { return rectifyResult; } public void setRectifyResult(String rectifyResult) { this.rectifyResult = rectifyResult; }
    public Integer getVerifyPersonId() { return verifyPersonId; } public void setVerifyPersonId(Integer verifyPersonId) { this.verifyPersonId = verifyPersonId; }
    public String getVerifyPersonName() { return verifyPersonName; } public void setVerifyPersonName(String verifyPersonName) { this.verifyPersonName = verifyPersonName; }
    public Timestamp getVerifyTime() { return verifyTime; } public void setVerifyTime(Timestamp verifyTime) { this.verifyTime = verifyTime; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
