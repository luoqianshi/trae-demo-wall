package bean;

import java.util.Date;

public class SatisfactionEvaluation {
    private int id;
    private int patientId;
    private String patientName;
    private String evaluateType;
    private int targetId;
    private String targetName;
    private int deptId;
    private String deptName;
    private int overallScore;
    private Integer attitudeScore;
    private Integer skillScore;
    private Integer efficiencyScore;
    private Integer environmentScore;
    private String commentText;
    private int isAnonymous;
    private String replyText;
    private String replyBy;
    private Date replyTime;
    private Date createTime;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getEvaluateType() { return evaluateType; }
    public void setEvaluateType(String evaluateType) { this.evaluateType = evaluateType; }
    public int getTargetId() { return targetId; }
    public void setTargetId(int targetId) { this.targetId = targetId; }
    public String getTargetName() { return targetName; }
    public void setTargetName(String targetName) { this.targetName = targetName; }
    public int getDeptId() { return deptId; }
    public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }
    public int getOverallScore() { return overallScore; }
    public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
    public Integer getAttitudeScore() { return attitudeScore; }
    public void setAttitudeScore(Integer attitudeScore) { this.attitudeScore = attitudeScore; }
    public Integer getSkillScore() { return skillScore; }
    public void setSkillScore(Integer skillScore) { this.skillScore = skillScore; }
    public Integer getEfficiencyScore() { return efficiencyScore; }
    public void setEfficiencyScore(Integer efficiencyScore) { this.efficiencyScore = efficiencyScore; }
    public Integer getEnvironmentScore() { return environmentScore; }
    public void setEnvironmentScore(Integer environmentScore) { this.environmentScore = environmentScore; }
    public String getCommentText() { return commentText; }
    public void setCommentText(String commentText) { this.commentText = commentText; }
    public int getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(int isAnonymous) { this.isAnonymous = isAnonymous; }
    public String getReplyText() { return replyText; }
    public void setReplyText(String replyText) { this.replyText = replyText; }
    public String getReplyBy() { return replyBy; }
    public void setReplyBy(String replyBy) { this.replyBy = replyBy; }
    public Date getReplyTime() { return replyTime; }
    public void setReplyTime(Date replyTime) { this.replyTime = replyTime; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
