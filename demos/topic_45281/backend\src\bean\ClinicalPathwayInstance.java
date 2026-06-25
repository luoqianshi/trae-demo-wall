package bean;
import java.math.BigDecimal;
import java.sql.Timestamp;

public class ClinicalPathwayInstance {
    private int id; private int pathwayId; private String pathwayName;
    private int inpatientId; private int patientId; private String patientName;
    private String admissionNo;
    private int doctorId; private String doctorName;
    private int deptId; private String deptName;
    private java.sql.Date entryDate; private java.sql.Date expectedExitDate;
    private java.sql.Date actualExitDate;
    private int currentDay = 1; private Integer totalDays;
    private String exitReason; private String variationRecord;
    private String variationType; private BigDecimal completionRate;
    private String status = "进行中";
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public int getPathwayId() { return pathwayId; } public void setPathwayId(int pathwayId) { this.pathwayId = pathwayId; }
    public String getPathwayName() { return pathwayName; } public void setPathwayName(String pathwayName) { this.pathwayName = pathwayName; }
    public int getInpatientId() { return inpatientId; } public void setInpatientId(int inpatientId) { this.inpatientId = inpatientId; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public java.sql.Date getEntryDate() { return entryDate; } public void setEntryDate(java.sql.Date entryDate) { this.entryDate = entryDate; }
    public java.sql.Date getExpectedExitDate() { return expectedExitDate; } public void setExpectedExitDate(java.sql.Date expectedExitDate) { this.expectedExitDate = expectedExitDate; }
    public java.sql.Date getActualExitDate() { return actualExitDate; } public void setActualExitDate(java.sql.Date actualExitDate) { this.actualExitDate = actualExitDate; }
    public int getCurrentDay() { return currentDay; } public void setCurrentDay(int currentDay) { this.currentDay = currentDay; }
    public Integer getTotalDays() { return totalDays; } public void setTotalDays(Integer totalDays) { this.totalDays = totalDays; }
    public String getExitReason() { return exitReason; } public void setExitReason(String exitReason) { this.exitReason = exitReason; }
    public String getVariationRecord() { return variationRecord; } public void setVariationRecord(String variationRecord) { this.variationRecord = variationRecord; }
    public String getVariationType() { return variationType; } public void setVariationType(String variationType) { this.variationType = variationType; }
    public BigDecimal getCompletionRate() { return completionRate; } public void setCompletionRate(BigDecimal completionRate) { this.completionRate = completionRate; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
