package bean;

import java.util.Date;

public class DrugSupplier {
    private int id; private String supplierCode; private String supplierName; private String supplierShortName;
    private String contactPerson; private String contactPhone; private String contactAddress;
    private String businessLicense; private String drugLicense; private String gspCertificate;
    private Date qualificationExpiry; private String bankName; private String bankAccount;
    private String taxNo; private int supplierRating; private String cooperationStatus;
    private String remark; private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getSupplierCode() { return supplierCode; } public void setSupplierCode(String v) { this.supplierCode = v; }
    public String getSupplierName() { return supplierName; } public void setSupplierName(String v) { this.supplierName = v; }
    public String getSupplierShortName() { return supplierShortName; } public void setSupplierShortName(String v) { this.supplierShortName = v; }
    public String getContactPerson() { return contactPerson; } public void setContactPerson(String v) { this.contactPerson = v; }
    public String getContactPhone() { return contactPhone; } public void setContactPhone(String v) { this.contactPhone = v; }
    public String getContactAddress() { return contactAddress; } public void setContactAddress(String v) { this.contactAddress = v; }
    public String getBusinessLicense() { return businessLicense; } public void setBusinessLicense(String v) { this.businessLicense = v; }
    public String getDrugLicense() { return drugLicense; } public void setDrugLicense(String v) { this.drugLicense = v; }
    public String getGspCertificate() { return gspCertificate; } public void setGspCertificate(String v) { this.gspCertificate = v; }
    public Date getQualificationExpiry() { return qualificationExpiry; } public void setQualificationExpiry(Date v) { this.qualificationExpiry = v; }
    public String getBankName() { return bankName; } public void setBankName(String v) { this.bankName = v; }
    public String getBankAccount() { return bankAccount; } public void setBankAccount(String v) { this.bankAccount = v; }
    public String getTaxNo() { return taxNo; } public void setTaxNo(String v) { this.taxNo = v; }
    public int getSupplierRating() { return supplierRating; } public void setSupplierRating(int v) { this.supplierRating = v; }
    public String getCooperationStatus() { return cooperationStatus; } public void setCooperationStatus(String v) { this.cooperationStatus = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}