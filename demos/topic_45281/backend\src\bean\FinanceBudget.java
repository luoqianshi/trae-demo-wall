package bean;

import java.math.BigDecimal;
import java.util.Date;

public class FinanceBudget {
    private int id; private String budgetNo; private String budgetYear; private String budgetPeriod;
    private int deptId; private String deptName; private String budgetType; private String budgetCategory;
    private BigDecimal budgetAmount; private BigDecimal usedAmount; private BigDecimal remainingAmount;
    private BigDecimal executionRate; private String status;
    private Integer approverId; private String approverName; private Date approveTime;
    private String remark; private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getBudgetNo() { return budgetNo; } public void setBudgetNo(String v) { this.budgetNo = v; }
    public String getBudgetYear() { return budgetYear; } public void setBudgetYear(String v) { this.budgetYear = v; }
    public String getBudgetPeriod() { return budgetPeriod; } public void setBudgetPeriod(String v) { this.budgetPeriod = v; }
    public int getDeptId() { return deptId; } public void setDeptId(int v) { this.deptId = v; }
    public String getDeptName() { return deptName; } public void setDeptName(String v) { this.deptName = v; }
    public String getBudgetType() { return budgetType; } public void setBudgetType(String v) { this.budgetType = v; }
    public String getBudgetCategory() { return budgetCategory; } public void setBudgetCategory(String v) { this.budgetCategory = v; }
    public BigDecimal getBudgetAmount() { return budgetAmount; } public void setBudgetAmount(BigDecimal v) { this.budgetAmount = v; }
    public BigDecimal getUsedAmount() { return usedAmount; } public void setUsedAmount(BigDecimal v) { this.usedAmount = v; }
    public BigDecimal getRemainingAmount() { return remainingAmount; } public void setRemainingAmount(BigDecimal v) { this.remainingAmount = v; }
    public BigDecimal getExecutionRate() { return executionRate; } public void setExecutionRate(BigDecimal v) { this.executionRate = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public Integer getApproverId() { return approverId; } public void setApproverId(Integer v) { this.approverId = v; }
    public String getApproverName() { return approverName; } public void setApproverName(String v) { this.approverName = v; }
    public Date getApproveTime() { return approveTime; } public void setApproveTime(Date v) { this.approveTime = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}