package bean;
import java.sql.Timestamp;
import java.math.BigDecimal;

public class PerformanceAssessment {
    private int id;
    private String assessNo;
    private String assessPeriod;
    private int deptId;
    private String deptName;
    private int staffId;
    private String staffName;
    private BigDecimal workQuantityScore;
    private BigDecimal workQualityScore;
    private BigDecimal serviceScore;
    private BigDecimal innovationScore;
    private BigDecimal teamworkScore;
    private BigDecimal totalScore;
    private String assessLevel;
    private BigDecimal bonusAmount;
    private BigDecimal penaltyAmount;
    private int assessorId;
    private String assessorName;
    private java.sql.Date assessDate;
    private String comment;
    private String status;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getAssessNo() { return assessNo; } public void setAssessNo(String assessNo) { this.assessNo = assessNo; }
    public String getAssessPeriod() { return assessPeriod; } public void setAssessPeriod(String assessPeriod) { this.assessPeriod = assessPeriod; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public int getStaffId() { return staffId; } public void setStaffId(int staffId) { this.staffId = staffId; }
    public String getStaffName() { return staffName; } public void setStaffName(String staffName) { this.staffName = staffName; }
    public BigDecimal getWorkQuantityScore() { return workQuantityScore; } public void setWorkQuantityScore(BigDecimal workQuantityScore) { this.workQuantityScore = workQuantityScore; }
    public BigDecimal getWorkQualityScore() { return workQualityScore; } public void setWorkQualityScore(BigDecimal workQualityScore) { this.workQualityScore = workQualityScore; }
    public BigDecimal getServiceScore() { return serviceScore; } public void setServiceScore(BigDecimal serviceScore) { this.serviceScore = serviceScore; }
    public BigDecimal getInnovationScore() { return innovationScore; } public void setInnovationScore(BigDecimal innovationScore) { this.innovationScore = innovationScore; }
    public BigDecimal getTeamworkScore() { return teamworkScore; } public void setTeamworkScore(BigDecimal teamworkScore) { this.teamworkScore = teamworkScore; }
    public BigDecimal getTotalScore() { return totalScore; } public void setTotalScore(BigDecimal totalScore) { this.totalScore = totalScore; }
    public String getAssessLevel() { return assessLevel; } public void setAssessLevel(String assessLevel) { this.assessLevel = assessLevel; }
    public BigDecimal getBonusAmount() { return bonusAmount; } public void setBonusAmount(BigDecimal bonusAmount) { this.bonusAmount = bonusAmount; }
    public BigDecimal getPenaltyAmount() { return penaltyAmount; } public void setPenaltyAmount(BigDecimal penaltyAmount) { this.penaltyAmount = penaltyAmount; }
    public int getAssessorId() { return assessorId; } public void setAssessorId(int assessorId) { this.assessorId = assessorId; }
    public String getAssessorName() { return assessorName; } public void setAssessorName(String assessorName) { this.assessorName = assessorName; }
    public java.sql.Date getAssessDate() { return assessDate; } public void setAssessDate(java.sql.Date assessDate) { this.assessDate = assessDate; }
    public String getComment() { return comment; } public void setComment(String comment) { this.comment = comment; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
