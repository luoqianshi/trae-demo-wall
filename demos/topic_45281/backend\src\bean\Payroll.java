package bean;

import java.math.BigDecimal;
import java.util.Date;

public class Payroll {
    private int id; private String payrollNo; private int staffId; private String staffNo;
    private String staffName; private int deptId; private String deptName; private String payPeriod;
    private BigDecimal baseSalary; private BigDecimal performanceSalary; private BigDecimal positionSalary;
    private BigDecimal overtimePay; private BigDecimal bonus; private BigDecimal subsidy;
    private BigDecimal grossPay; private BigDecimal pensionInsurance; private BigDecimal medicalInsurance;
    private BigDecimal unemploymentInsurance; private BigDecimal housingFund; private BigDecimal incomeTax;
    private BigDecimal otherDeductions; private BigDecimal totalDeductions; private BigDecimal netPay;
    private String payStatus; private Date payDate; private String payMethod;
    private Integer operatorId; private String operatorName; private String remark; private Date createTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getPayrollNo() { return payrollNo; } public void setPayrollNo(String v) { this.payrollNo = v; }
    public int getStaffId() { return staffId; } public void setStaffId(int v) { this.staffId = v; }
    public String getStaffNo() { return staffNo; } public void setStaffNo(String v) { this.staffNo = v; }
    public String getStaffName() { return staffName; } public void setStaffName(String v) { this.staffName = v; }
    public int getDeptId() { return deptId; } public void setDeptId(int v) { this.deptId = v; }
    public String getDeptName() { return deptName; } public void setDeptName(String v) { this.deptName = v; }
    public String getPayPeriod() { return payPeriod; } public void setPayPeriod(String v) { this.payPeriod = v; }
    public BigDecimal getBaseSalary() { return baseSalary; } public void setBaseSalary(BigDecimal v) { this.baseSalary = v; }
    public BigDecimal getPerformanceSalary() { return performanceSalary; } public void setPerformanceSalary(BigDecimal v) { this.performanceSalary = v; }
    public BigDecimal getPositionSalary() { return positionSalary; } public void setPositionSalary(BigDecimal v) { this.positionSalary = v; }
    public BigDecimal getOvertimePay() { return overtimePay; } public void setOvertimePay(BigDecimal v) { this.overtimePay = v; }
    public BigDecimal getBonus() { return bonus; } public void setBonus(BigDecimal v) { this.bonus = v; }
    public BigDecimal getSubsidy() { return subsidy; } public void setSubsidy(BigDecimal v) { this.subsidy = v; }
    public BigDecimal getGrossPay() { return grossPay; } public void setGrossPay(BigDecimal v) { this.grossPay = v; }
    public BigDecimal getPensionInsurance() { return pensionInsurance; } public void setPensionInsurance(BigDecimal v) { this.pensionInsurance = v; }
    public BigDecimal getMedicalInsurance() { return medicalInsurance; } public void setMedicalInsurance(BigDecimal v) { this.medicalInsurance = v; }
    public BigDecimal getUnemploymentInsurance() { return unemploymentInsurance; } public void setUnemploymentInsurance(BigDecimal v) { this.unemploymentInsurance = v; }
    public BigDecimal getHousingFund() { return housingFund; } public void setHousingFund(BigDecimal v) { this.housingFund = v; }
    public BigDecimal getIncomeTax() { return incomeTax; } public void setIncomeTax(BigDecimal v) { this.incomeTax = v; }
    public BigDecimal getOtherDeductions() { return otherDeductions; } public void setOtherDeductions(BigDecimal v) { this.otherDeductions = v; }
    public BigDecimal getTotalDeductions() { return totalDeductions; } public void setTotalDeductions(BigDecimal v) { this.totalDeductions = v; }
    public BigDecimal getNetPay() { return netPay; } public void setNetPay(BigDecimal v) { this.netPay = v; }
    public String getPayStatus() { return payStatus; } public void setPayStatus(String v) { this.payStatus = v; }
    public Date getPayDate() { return payDate; } public void setPayDate(Date v) { this.payDate = v; }
    public String getPayMethod() { return payMethod; } public void setPayMethod(String v) { this.payMethod = v; }
    public Integer getOperatorId() { return operatorId; } public void setOperatorId(Integer v) { this.operatorId = v; }
    public String getOperatorName() { return operatorName; } public void setOperatorName(String v) { this.operatorName = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
}