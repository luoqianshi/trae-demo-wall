package bean;

import java.math.BigDecimal;
import java.util.Date;

public class PhysicalExam {
    private int id;
    private int patientId;
    private String patientName;
    private String examDate;
    private String status;
    private String conclusion;
    private String examiner;
    private String items;
    private BigDecimal totalFee;
    private String remark;
    private Date createTime;

    public PhysicalExam() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getExamDate() { return examDate; }
    public void setExamDate(String examDate) { this.examDate = examDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getConclusion() { return conclusion; }
    public void setConclusion(String conclusion) { this.conclusion = conclusion; }

    public String getExaminer() { return examiner; }
    public void setExaminer(String examiner) { this.examiner = examiner; }

    public String getItems() { return items; }
    public void setItems(String items) { this.items = items; }

    public BigDecimal getTotalFee() { return totalFee; }
    public void setTotalFee(BigDecimal totalFee) { this.totalFee = totalFee; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}