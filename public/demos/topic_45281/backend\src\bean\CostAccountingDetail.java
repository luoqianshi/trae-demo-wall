package bean;

import java.math.BigDecimal;
import java.util.Date;

public class CostAccountingDetail {
    private int id; private String accountingNo; private String accountPeriod; private int deptId;
    private String deptName; private String costType; private String costCategory;
    private BigDecimal directCost; private BigDecimal indirectCost; private BigDecimal totalCost;
    private BigDecimal revenueAmount; private BigDecimal profitMargin; private String costDriver;
    private String status; private String remark; private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getAccountingNo() { return accountingNo; } public void setAccountingNo(String v) { this.accountingNo = v; }
    public String getAccountPeriod() { return accountPeriod; } public void setAccountPeriod(String v) { this.accountPeriod = v; }
    public int getDeptId() { return deptId; } public void setDeptId(int v) { this.deptId = v; }
    public String getDeptName() { return deptName; } public void setDeptName(String v) { this.deptName = v; }
    public String getCostType() { return costType; } public void setCostType(String v) { this.costType = v; }
    public String getCostCategory() { return costCategory; } public void setCostCategory(String v) { this.costCategory = v; }
    public BigDecimal getDirectCost() { return directCost; } public void setDirectCost(BigDecimal v) { this.directCost = v; }
    public BigDecimal getIndirectCost() { return indirectCost; } public void setIndirectCost(BigDecimal v) { this.indirectCost = v; }
    public BigDecimal getTotalCost() { return totalCost; } public void setTotalCost(BigDecimal v) { this.totalCost = v; }
    public BigDecimal getRevenueAmount() { return revenueAmount; } public void setRevenueAmount(BigDecimal v) { this.revenueAmount = v; }
    public BigDecimal getProfitMargin() { return profitMargin; } public void setProfitMargin(BigDecimal v) { this.profitMargin = v; }
    public String getCostDriver() { return costDriver; } public void setCostDriver(String v) { this.costDriver = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}