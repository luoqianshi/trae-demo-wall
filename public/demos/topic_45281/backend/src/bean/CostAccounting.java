package bean;
import java.sql.Timestamp;
import java.math.BigDecimal;

public class CostAccounting {
    private int id;
    private String accountNo;
    private String accountPeriod;
    private int deptId;
    private String deptName;
    private BigDecimal personnelCost;
    private BigDecimal materialCost;
    private BigDecimal equipmentCost;
    private BigDecimal drugCost;
    private BigDecimal managementCost;
    private BigDecimal otherCost;
    private BigDecimal totalCost;
    private BigDecimal revenue;
    private BigDecimal profit;
    private BigDecimal costPerBedDay;
    private BigDecimal costPerVisit;
    private int accountantId;
    private String accountantName;
    private java.sql.Date accountDate;
    private String status;
    private String remark;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getAccountNo() { return accountNo; } public void setAccountNo(String accountNo) { this.accountNo = accountNo; }
    public String getAccountPeriod() { return accountPeriod; } public void setAccountPeriod(String accountPeriod) { this.accountPeriod = accountPeriod; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public BigDecimal getPersonnelCost() { return personnelCost; } public void setPersonnelCost(BigDecimal personnelCost) { this.personnelCost = personnelCost; }
    public BigDecimal getMaterialCost() { return materialCost; } public void setMaterialCost(BigDecimal materialCost) { this.materialCost = materialCost; }
    public BigDecimal getEquipmentCost() { return equipmentCost; } public void setEquipmentCost(BigDecimal equipmentCost) { this.equipmentCost = equipmentCost; }
    public BigDecimal getDrugCost() { return drugCost; } public void setDrugCost(BigDecimal drugCost) { this.drugCost = drugCost; }
    public BigDecimal getManagementCost() { return managementCost; } public void setManagementCost(BigDecimal managementCost) { this.managementCost = managementCost; }
    public BigDecimal getOtherCost() { return otherCost; } public void setOtherCost(BigDecimal otherCost) { this.otherCost = otherCost; }
    public BigDecimal getTotalCost() { return totalCost; } public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
    public BigDecimal getRevenue() { return revenue; } public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
    public BigDecimal getProfit() { return profit; } public void setProfit(BigDecimal profit) { this.profit = profit; }
    public BigDecimal getCostPerBedDay() { return costPerBedDay; } public void setCostPerBedDay(BigDecimal costPerBedDay) { this.costPerBedDay = costPerBedDay; }
    public BigDecimal getCostPerVisit() { return costPerVisit; } public void setCostPerVisit(BigDecimal costPerVisit) { this.costPerVisit = costPerVisit; }
    public int getAccountantId() { return accountantId; } public void setAccountantId(int accountantId) { this.accountantId = accountantId; }
    public String getAccountantName() { return accountantName; } public void setAccountantName(String accountantName) { this.accountantName = accountantName; }
    public java.sql.Date getAccountDate() { return accountDate; } public void setAccountDate(java.sql.Date accountDate) { this.accountDate = accountDate; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getRemark() { return remark; } public void setRemark(String remark) { this.remark = remark; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
