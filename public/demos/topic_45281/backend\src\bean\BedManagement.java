package bean;
import java.sql.Timestamp;
import java.math.BigDecimal;

public class BedManagement {
    private int id;
    private String bedNo;
    private int wardId;
    private String wardName;
    private int deptId;
    private String deptName;
    private String bedType;
    private String bedStatus;
    private Integer patientId;
    private String patientName;
    private Timestamp admitTime;
    private BigDecimal dailyRate;
    private Integer nurseId;
    private String nurseName;
    private String remark;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getBedNo() { return bedNo; } public void setBedNo(String bedNo) { this.bedNo = bedNo; }
    public int getWardId() { return wardId; } public void setWardId(int wardId) { this.wardId = wardId; }
    public String getWardName() { return wardName; } public void setWardName(String wardName) { this.wardName = wardName; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getBedType() { return bedType; } public void setBedType(String bedType) { this.bedType = bedType; }
    public String getBedStatus() { return bedStatus; } public void setBedStatus(String bedStatus) { this.bedStatus = bedStatus; }
    public Integer getPatientId() { return patientId; } public void setPatientId(Integer patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public Timestamp getAdmitTime() { return admitTime; } public void setAdmitTime(Timestamp admitTime) { this.admitTime = admitTime; }
    public BigDecimal getDailyRate() { return dailyRate; } public void setDailyRate(BigDecimal dailyRate) { this.dailyRate = dailyRate; }
    public Integer getNurseId() { return nurseId; } public void setNurseId(Integer nurseId) { this.nurseId = nurseId; }
    public String getNurseName() { return nurseName; } public void setNurseName(String nurseName) { this.nurseName = nurseName; }
    public String getRemark() { return remark; } public void setRemark(String remark) { this.remark = remark; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
