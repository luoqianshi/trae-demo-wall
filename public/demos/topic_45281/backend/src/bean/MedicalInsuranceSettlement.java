package bean;

import java.math.BigDecimal;
import java.util.Date;

public class MedicalInsuranceSettlement {
    private int id; private String settlementNo; private int chargeId; private int patientId;
    private String patientName; private String insuranceType; private String insuranceNo;
    private BigDecimal totalFee; private BigDecimal insurancePaid; private BigDecimal fundPaid;
    private BigDecimal personalAccountPaid; private BigDecimal personalCashPaid;
    private BigDecimal deductibleAmount; private BigDecimal reimbursementRatio;
    private BigDecimal selfPaidRatio; private BigDecimal selfPaidAmount;
    private Date settlementTime; private int operatorId; private String operatorName;
    private String status; private Date createTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getSettlementNo() { return settlementNo; } public void setSettlementNo(String v) { this.settlementNo = v; }
    public int getChargeId() { return chargeId; } public void setChargeId(int v) { this.chargeId = v; }
    public int getPatientId() { return patientId; } public void setPatientId(int v) { this.patientId = v; }
    public String getPatientName() { return patientName; } public void setPatientName(String v) { this.patientName = v; }
    public String getInsuranceType() { return insuranceType; } public void setInsuranceType(String v) { this.insuranceType = v; }
    public String getInsuranceNo() { return insuranceNo; } public void setInsuranceNo(String v) { this.insuranceNo = v; }
    public BigDecimal getTotalFee() { return totalFee; } public void setTotalFee(BigDecimal v) { this.totalFee = v; }
    public BigDecimal getInsurancePaid() { return insurancePaid; } public void setInsurancePaid(BigDecimal v) { this.insurancePaid = v; }
    public BigDecimal getFundPaid() { return fundPaid; } public void setFundPaid(BigDecimal v) { this.fundPaid = v; }
    public BigDecimal getPersonalAccountPaid() { return personalAccountPaid; } public void setPersonalAccountPaid(BigDecimal v) { this.personalAccountPaid = v; }
    public BigDecimal getPersonalCashPaid() { return personalCashPaid; } public void setPersonalCashPaid(BigDecimal v) { this.personalCashPaid = v; }
    public BigDecimal getDeductibleAmount() { return deductibleAmount; } public void setDeductibleAmount(BigDecimal v) { this.deductibleAmount = v; }
    public BigDecimal getReimbursementRatio() { return reimbursementRatio; } public void setReimbursementRatio(BigDecimal v) { this.reimbursementRatio = v; }
    public BigDecimal getSelfPaidRatio() { return selfPaidRatio; } public void setSelfPaidRatio(BigDecimal v) { this.selfPaidRatio = v; }
    public BigDecimal getSelfPaidAmount() { return selfPaidAmount; } public void setSelfPaidAmount(BigDecimal v) { this.selfPaidAmount = v; }
    public Date getSettlementTime() { return settlementTime; } public void setSettlementTime(Date v) { this.settlementTime = v; }
    public int getOperatorId() { return operatorId; } public void setOperatorId(int v) { this.operatorId = v; }
    public String getOperatorName() { return operatorName; } public void setOperatorName(String v) { this.operatorName = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
}