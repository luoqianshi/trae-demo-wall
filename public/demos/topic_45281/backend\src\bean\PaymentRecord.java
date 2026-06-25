package bean;

import java.math.BigDecimal;
import java.util.Date;

public class PaymentRecord {
    private int id;
    private String orderNo;
    private int patientId;
    private String patientName;
    private String businessType;
    private int businessId;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal discountAmount;
    private BigDecimal insuranceAmount;
    private BigDecimal selfPayAmount;
    private String paymentMethod;
    private String paymentStatus;
    private String payerName;
    private int cashierId;
    private String cashierName;
    private String transactionNo;
    private String refundOrderNo;
    private String refundReason;
    private Date payTime;
    private Date createTime;
    private Date updateTime;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }
    public int getBusinessId() { return businessId; }
    public void setBusinessId(int businessId) { this.businessId = businessId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public BigDecimal getInsuranceAmount() { return insuranceAmount; }
    public void setInsuranceAmount(BigDecimal insuranceAmount) { this.insuranceAmount = insuranceAmount; }
    public BigDecimal getSelfPayAmount() { return selfPayAmount; }
    public void setSelfPayAmount(BigDecimal selfPayAmount) { this.selfPayAmount = selfPayAmount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getPayerName() { return payerName; }
    public void setPayerName(String payerName) { this.payerName = payerName; }
    public int getCashierId() { return cashierId; }
    public void setCashierId(int cashierId) { this.cashierId = cashierId; }
    public String getCashierName() { return cashierName; }
    public void setCashierName(String cashierName) { this.cashierName = cashierName; }
    public String getTransactionNo() { return transactionNo; }
    public void setTransactionNo(String transactionNo) { this.transactionNo = transactionNo; }
    public String getRefundOrderNo() { return refundOrderNo; }
    public void setRefundOrderNo(String refundOrderNo) { this.refundOrderNo = refundOrderNo; }
    public String getRefundReason() { return refundReason; }
    public void setRefundReason(String refundReason) { this.refundReason = refundReason; }
    public Date getPayTime() { return payTime; }
    public void setPayTime(Date payTime) { this.payTime = payTime; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }
}
