package bean;
import java.sql.Timestamp;

public class AdverseEvent {
    private int id;
    private String eventNo;
    private String eventType;
    private String eventLevel;
    private Timestamp occurTime;
    private String occurLocation;
    private int deptId;
    private String deptName;
    private Integer patientId;
    private String patientName;
    private String medicalRecordNo;
    private String admissionNo;
    private String involvedStaffIds;
    private String involvedStaffNames;
    private String eventDescription;
    private String immediateAction;
    private String rootCauseAnalysis;
    private int reporterId;
    private String reporterName;
    private Timestamp reportTime;
    private Integer reviewerId;
    private String reviewerName;
    private Timestamp reviewTime;
    private String reviewResult;
    private String improvementPlan;
    private String trackingStatus;
    private String status;
    private int isHidden;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getEventNo() { return eventNo; } public void setEventNo(String eventNo) { this.eventNo = eventNo; }
    public String getEventType() { return eventType; } public void setEventType(String eventType) { this.eventType = eventType; }
    public String getEventLevel() { return eventLevel; } public void setEventLevel(String eventLevel) { this.eventLevel = eventLevel; }
    public Timestamp getOccurTime() { return occurTime; } public void setOccurTime(Timestamp occurTime) { this.occurTime = occurTime; }
    public String getOccurLocation() { return occurLocation; } public void setOccurLocation(String occurLocation) { this.occurLocation = occurLocation; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public Integer getPatientId() { return patientId; } public void setPatientId(Integer patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public String getInvolvedStaffIds() { return involvedStaffIds; } public void setInvolvedStaffIds(String involvedStaffIds) { this.involvedStaffIds = involvedStaffIds; }
    public String getInvolvedStaffNames() { return involvedStaffNames; } public void setInvolvedStaffNames(String involvedStaffNames) { this.involvedStaffNames = involvedStaffNames; }
    public String getEventDescription() { return eventDescription; } public void setEventDescription(String eventDescription) { this.eventDescription = eventDescription; }
    public String getImmediateAction() { return immediateAction; } public void setImmediateAction(String immediateAction) { this.immediateAction = immediateAction; }
    public String getRootCauseAnalysis() { return rootCauseAnalysis; } public void setRootCauseAnalysis(String rootCauseAnalysis) { this.rootCauseAnalysis = rootCauseAnalysis; }
    public int getReporterId() { return reporterId; } public void setReporterId(int reporterId) { this.reporterId = reporterId; }
    public String getReporterName() { return reporterName; } public void setReporterName(String reporterName) { this.reporterName = reporterName; }
    public Timestamp getReportTime() { return reportTime; } public void setReportTime(Timestamp reportTime) { this.reportTime = reportTime; }
    public Integer getReviewerId() { return reviewerId; } public void setReviewerId(Integer reviewerId) { this.reviewerId = reviewerId; }
    public String getReviewerName() { return reviewerName; } public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
    public Timestamp getReviewTime() { return reviewTime; } public void setReviewTime(Timestamp reviewTime) { this.reviewTime = reviewTime; }
    public String getReviewResult() { return reviewResult; } public void setReviewResult(String reviewResult) { this.reviewResult = reviewResult; }
    public String getImprovementPlan() { return improvementPlan; } public void setImprovementPlan(String improvementPlan) { this.improvementPlan = improvementPlan; }
    public String getTrackingStatus() { return trackingStatus; } public void setTrackingStatus(String trackingStatus) { this.trackingStatus = trackingStatus; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public int getIsHidden() { return isHidden; } public void setIsHidden(int isHidden) { this.isHidden = isHidden; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
