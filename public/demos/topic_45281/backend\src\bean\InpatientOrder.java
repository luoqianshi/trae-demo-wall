package bean;
import java.math.BigDecimal;
import java.sql.Timestamp;

public class InpatientOrder {
    private int id; private int inpatientId; private int patientId; private String patientName;
    private String admissionNo; private String bedNo; private String orderGroupNo;
    private String orderType; private String category; private String orderContent;
    private Integer drugId; private String drugName; private String dosage; private String dosageUnit;
    private String frequency; private String route; private Integer quantity; private String unit;
    private Timestamp startTime; private Timestamp stopTime; private Integer stopDoctorId;
    private String stopDoctorName; private String stopReason; private int doctorId; private String doctorName;
    private Integer nurseId; private String nurseName; private Timestamp executeTime;
    private String status = "待审核"; private Integer reviewerId; private String reviewerName;
    private Timestamp reviewTime; private String priority = "普通"; private int isPrn = 0;
    private String remark; private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public int getInpatientId() { return inpatientId; } public void setInpatientId(int inpatientId) { this.inpatientId = inpatientId; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public String getBedNo() { return bedNo; } public void setBedNo(String bedNo) { this.bedNo = bedNo; }
    public String getOrderGroupNo() { return orderGroupNo; } public void setOrderGroupNo(String orderGroupNo) { this.orderGroupNo = orderGroupNo; }
    public String getOrderType() { return orderType; } public void setOrderType(String orderType) { this.orderType = orderType; }
    public String getCategory() { return category; } public void setCategory(String category) { this.category = category; }
    public String getOrderContent() { return orderContent; } public void setOrderContent(String orderContent) { this.orderContent = orderContent; }
    public Integer getDrugId() { return drugId; } public void setDrugId(Integer drugId) { this.drugId = drugId; }
    public String getDrugName() { return drugName; } public void setDrugName(String drugName) { this.drugName = drugName; }
    public String getDosage() { return dosage; } public void setDosage(String dosage) { this.dosage = dosage; }
    public String getDosageUnit() { return dosageUnit; } public void setDosageUnit(String dosageUnit) { this.dosageUnit = dosageUnit; }
    public String getFrequency() { return frequency; } public void setFrequency(String frequency) { this.frequency = frequency; }
    public String getRoute() { return route; } public void setRoute(String route) { this.route = route; }
    public Integer getQuantity() { return quantity; } public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; } public void setUnit(String unit) { this.unit = unit; }
    public Timestamp getStartTime() { return startTime; } public void setStartTime(Timestamp startTime) { this.startTime = startTime; }
    public Timestamp getStopTime() { return stopTime; } public void setStopTime(Timestamp stopTime) { this.stopTime = stopTime; }
    public Integer getStopDoctorId() { return stopDoctorId; } public void setStopDoctorId(Integer stopDoctorId) { this.stopDoctorId = stopDoctorId; }
    public String getStopDoctorName() { return stopDoctorName; } public void setStopDoctorName(String stopDoctorName) { this.stopDoctorName = stopDoctorName; }
    public String getStopReason() { return stopReason; } public void setStopReason(String stopReason) { this.stopReason = stopReason; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public Integer getNurseId() { return nurseId; } public void setNurseId(Integer nurseId) { this.nurseId = nurseId; }
    public String getNurseName() { return nurseName; } public void setNurseName(String nurseName) { this.nurseName = nurseName; }
    public Timestamp getExecuteTime() { return executeTime; } public void setExecuteTime(Timestamp executeTime) { this.executeTime = executeTime; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Integer getReviewerId() { return reviewerId; } public void setReviewerId(Integer reviewerId) { this.reviewerId = reviewerId; }
    public String getReviewerName() { return reviewerName; } public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
    public Timestamp getReviewTime() { return reviewTime; } public void setReviewTime(Timestamp reviewTime) { this.reviewTime = reviewTime; }
    public String getPriority() { return priority; } public void setPriority(String priority) { this.priority = priority; }
    public int getIsPrn() { return isPrn; } public void setIsPrn(int isPrn) { this.isPrn = isPrn; }
    public String getRemark() { return remark; } public void setRemark(String remark) { this.remark = remark; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
