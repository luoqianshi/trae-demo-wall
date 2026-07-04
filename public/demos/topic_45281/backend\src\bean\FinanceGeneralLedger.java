package bean;

import java.math.BigDecimal;
import java.util.Date;

public class FinanceGeneralLedger {
    private int id; private String voucherNo; private String accountPeriod; private Date accountDate;
    private String summary; private String subjectCode; private String subjectName; private String subjectType;
    private BigDecimal debitAmount; private BigDecimal creditAmount; private BigDecimal balanceAmount;
    private String businessType; private Integer businessId; private Integer deptId; private String deptName;
    private int operatorId; private String operatorName; private String voucherStatus;
    private Date auditTime; private Integer auditorId; private String auditorName; private Date createTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getVoucherNo() { return voucherNo; } public void setVoucherNo(String v) { this.voucherNo = v; }
    public String getAccountPeriod() { return accountPeriod; } public void setAccountPeriod(String v) { this.accountPeriod = v; }
    public Date getAccountDate() { return accountDate; } public void setAccountDate(Date v) { this.accountDate = v; }
    public String getSummary() { return summary; } public void setSummary(String v) { this.summary = v; }
    public String getSubjectCode() { return subjectCode; } public void setSubjectCode(String v) { this.subjectCode = v; }
    public String getSubjectName() { return subjectName; } public void setSubjectName(String v) { this.subjectName = v; }
    public String getSubjectType() { return subjectType; } public void setSubjectType(String v) { this.subjectType = v; }
    public BigDecimal getDebitAmount() { return debitAmount; } public void setDebitAmount(BigDecimal v) { this.debitAmount = v; }
    public BigDecimal getCreditAmount() { return creditAmount; } public void setCreditAmount(BigDecimal v) { this.creditAmount = v; }
    public BigDecimal getBalanceAmount() { return balanceAmount; } public void setBalanceAmount(BigDecimal v) { this.balanceAmount = v; }
    public String getBusinessType() { return businessType; } public void setBusinessType(String v) { this.businessType = v; }
    public Integer getBusinessId() { return businessId; } public void setBusinessId(Integer v) { this.businessId = v; }
    public Integer getDeptId() { return deptId; } public void setDeptId(Integer v) { this.deptId = v; }
    public String getDeptName() { return deptName; } public void setDeptName(String v) { this.deptName = v; }
    public int getOperatorId() { return operatorId; } public void setOperatorId(int v) { this.operatorId = v; }
    public String getOperatorName() { return operatorName; } public void setOperatorName(String v) { this.operatorName = v; }
    public String getVoucherStatus() { return voucherStatus; } public void setVoucherStatus(String v) { this.voucherStatus = v; }
    public Date getAuditTime() { return auditTime; } public void setAuditTime(Date v) { this.auditTime = v; }
    public Integer getAuditorId() { return auditorId; } public void setAuditorId(Integer v) { this.auditorId = v; }
    public String getAuditorName() { return auditorName; } public void setAuditorName(String v) { this.auditorName = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
}