package bean;
import java.sql.Timestamp;

public class ImagingReport {
    private int id; private int examId; private String examNo;
    private String findings; private String impression; private String recommendation;
    private String reportType = "初步报告";
    private int radiologistId; private String radiologistName; private Timestamp reportTime;
    private Integer reviewerId; private String reviewerName; private Timestamp reviewTime;
    private String status = "草稿";
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public int getExamId() { return examId; } public void setExamId(int examId) { this.examId = examId; }
    public String getExamNo() { return examNo; } public void setExamNo(String examNo) { this.examNo = examNo; }
    public String getFindings() { return findings; } public void setFindings(String findings) { this.findings = findings; }
    public String getImpression() { return impression; } public void setImpression(String impression) { this.impression = impression; }
    public String getRecommendation() { return recommendation; } public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public String getReportType() { return reportType; } public void setReportType(String reportType) { this.reportType = reportType; }
    public int getRadiologistId() { return radiologistId; } public void setRadiologistId(int radiologistId) { this.radiologistId = radiologistId; }
    public String getRadiologistName() { return radiologistName; } public void setRadiologistName(String radiologistName) { this.radiologistName = radiologistName; }
    public Timestamp getReportTime() { return reportTime; } public void setReportTime(Timestamp reportTime) { this.reportTime = reportTime; }
    public Integer getReviewerId() { return reviewerId; } public void setReviewerId(Integer reviewerId) { this.reviewerId = reviewerId; }
    public String getReviewerName() { return reviewerName; } public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
    public Timestamp getReviewTime() { return reviewTime; } public void setReviewTime(Timestamp reviewTime) { this.reviewTime = reviewTime; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
