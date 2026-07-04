package bean;

import java.util.Date;

public class CompanionService {
    private int id;
    private Integer inpatientId;
    private int patientId;
    private String patientName;
    private String companionName;
    private String companionPhone;
    private String companionIdCard;
    private String relation;
    private Date startDate;
    private Date endDate;
    private String status;
    private String remark;
    private Date createTime;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public Integer getInpatientId() { return inpatientId; }
    public void setInpatientId(Integer inpatientId) { this.inpatientId = inpatientId; }
    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getCompanionName() { return companionName; }
    public void setCompanionName(String companionName) { this.companionName = companionName; }
    public String getCompanionPhone() { return companionPhone; }
    public void setCompanionPhone(String companionPhone) { this.companionPhone = companionPhone; }
    public String getCompanionIdCard() { return companionIdCard; }
    public void setCompanionIdCard(String companionIdCard) { this.companionIdCard = companionIdCard; }
    public String getRelation() { return relation; }
    public void setRelation(String relation) { this.relation = relation; }
    public Date getStartDate() { return startDate; }
    public void setStartDate(Date startDate) { this.startDate = startDate; }
    public Date getEndDate() { return endDate; }
    public void setEndDate(Date endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
