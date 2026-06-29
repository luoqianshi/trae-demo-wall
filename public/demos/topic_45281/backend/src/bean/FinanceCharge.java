package bean;
import java.sql.Timestamp;
import java.math.BigDecimal;

public class FinanceCharge {
    private int id;
    private String chargeNo;
    private int patientId;
    private String patientName;
    private String medicalRecordNo;
    private String admissionNo;
    private String chargeType;
    private BigDecimal totalAmount;
    private BigDecimal selfPayAmount;
    private BigDecimal insuranceAmount;
    private BigDecimal discountAmount;
    private BigDecimal actualAmount;
    private String paymentMethod;
    private String chargeItems;
    private Integer chargeDeptId;
    private String chargeDeptName;
    private int chargerId;
    private String chargerName;
    private Timestamp chargeTime;
    private int refundFlag;
    private BigDecimal refundAmount;
    private Timestamp refundTime;
    private String status;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getChargeNo() { return chargeNo; } public void setChargeNo(String chargeNo) { this.chargeNo = chargeNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public String getChargeType() { return chargeType; } public void setChargeType(String chargeType) { this.chargeType = chargeType; }
    public BigDecimal getTotalAmount() { return totalAmount; } public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getSelfPayAmount() { return selfPayAmount; } public void setSelfPayAmount(BigDecimal selfPayAmount) { this.selfPayAmount = selfPayAmount; }
    public BigDecimal getInsuranceAmount() { return insuranceAmount; } public void setInsuranceAmount(BigDecimal insuranceAmount) { this.insuranceAmount = insuranceAmount; }
    public BigDecimal getDiscountAmount() { return discountAmount; } public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public BigDecimal getActualAmount() { return actualAmount; } public void setActualAmount(BigDecimal actualAmount) { this.actualAmount = actualAmount; }
    public String getPaymentMethod() { return paymentMethod; } public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getChargeItems() { return chargeItems; } public void setChargeItems(String chargeItems) { this.chargeItems = chargeItems; }
    public Integer getChargeDeptId() { return chargeDeptId; } public void setChargeDeptId(Integer chargeDeptId) { this.chargeDeptId = chargeDeptId; }
    public String getChargeDeptName() { return chargeDeptName; } public void setChargeDeptName(String chargeDeptName) { this.chargeDeptName = chargeDeptName; }
    public int getChargerId() { return chargerId; } public void setChargerId(int chargerId) { this.chargerId = chargerId; }
    public String getChargerName() { return chargerName; } public void setChargerName(String chargerName) { this.chargerName = chargerName; }
    public Timestamp getChargeTime() { return chargeTime; } public void setChargeTime(Timestamp chargeTime) { this.chargeTime = chargeTime; }
    public int getRefundFlag() { return refundFlag; } public void setRefundFlag(int refundFlag) { this.refundFlag = refundFlag; }
    public BigDecimal getRefundAmount() { return refundAmount; } public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }
    public Timestamp getRefundTime() { return refundTime; } public void setRefundTime(Timestamp refundTime) { this.refundTime = refundTime; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
