package bean;

import java.util.Date;

public class ExaminationReport {
    private int id; private String reportNo; private int orderId; private int patientId;
    private String patientName; private int examinationId; private String examinationName;
    private String examinationType; private String reportStatus; private String reportContent;
    private String reportConclusion; private String reportDiagnosis; private String imagingData;
    private int imageCount; private Integer reporterId; private String reporterName;
    private Date reportTime; private Integer verifierId; private String verifierName;
    private Date verifyTime; private int isAbnormal; private int criticalValue;
    private String criticalValueContent; private Date criticalValueReportTime;
    private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getReportNo() { return reportNo; } public void setReportNo(String v) { this.reportNo = v; }
    public int getOrderId() { return orderId; } public void setOrderId(int v) { this.orderId = v; }
    public int getPatientId() { return patientId; } public void setPatientId(int v) { this.patientId = v; }
    public String getPatientName() { return patientName; } public void setPatientName(String v) { this.patientName = v; }
    public int getExaminationId() { return examinationId; } public void setExaminationId(int v) { this.examinationId = v; }
    public String getExaminationName() { return examinationName; } public void setExaminationName(String v) { this.examinationName = v; }
    public String getExaminationType() { return examinationType; } public void setExaminationType(String v) { this.examinationType = v; }
    public String getReportStatus() { return reportStatus; } public void setReportStatus(String v) { this.reportStatus = v; }
    public String getReportContent() { return reportContent; } public void setReportContent(String v) { this.reportContent = v; }
    public String getReportConclusion() { return reportConclusion; } public void setReportConclusion(String v) { this.reportConclusion = v; }
    public String getReportDiagnosis() { return reportDiagnosis; } public void setReportDiagnosis(String v) { this.reportDiagnosis = v; }
    public String getImagingData() { return imagingData; } public void setImagingData(String v) { this.imagingData = v; }
    public int getImageCount() { return imageCount; } public void setImageCount(int v) { this.imageCount = v; }
    public Integer getReporterId() { return reporterId; } public void setReporterId(Integer v) { this.reporterId = v; }
    public String getReporterName() { return reporterName; } public void setReporterName(String v) { this.reporterName = v; }
    public Date getReportTime() { return reportTime; } public void setReportTime(Date v) { this.reportTime = v; }
    public Integer getVerifierId() { return verifierId; } public void setVerifierId(Integer v) { this.verifierId = v; }
    public String getVerifierName() { return verifierName; } public void setVerifierName(String v) { this.verifierName = v; }
    public Date getVerifyTime() { return verifyTime; } public void setVerifyTime(Date v) { this.verifyTime = v; }
    public int getIsAbnormal() { return isAbnormal; } public void setIsAbnormal(int v) { this.isAbnormal = v; }
    public int getCriticalValue() { return criticalValue; } public void setCriticalValue(int v) { this.criticalValue = v; }
    public String getCriticalValueContent() { return criticalValueContent; } public void setCriticalValueContent(String v) { this.criticalValueContent = v; }
    public Date getCriticalValueReportTime() { return criticalValueReportTime; } public void setCriticalValueReportTime(Date v) { this.criticalValueReportTime = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}