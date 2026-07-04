package bean;

import java.math.BigDecimal;
import java.util.Date;

public class DrugPurchaseItem {
    private int id; private int purchaseId; private int drugId; private String drugName;
    private String drugSpec; private String drugUnit; private String batchNo; private Date expireDate;
    private int quantity; private int receivedQuantity; private BigDecimal unitPrice;
    private BigDecimal totalPrice; private BigDecimal discountRatio; private BigDecimal discountAmount;
    private BigDecimal taxRate; private BigDecimal taxAmount; private Date productionDate;
    private String manufacturer; private String storageCondition; private String remark; private Date createTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public int getPurchaseId() { return purchaseId; } public void setPurchaseId(int v) { this.purchaseId = v; }
    public int getDrugId() { return drugId; } public void setDrugId(int v) { this.drugId = v; }
    public String getDrugName() { return drugName; } public void setDrugName(String v) { this.drugName = v; }
    public String getDrugSpec() { return drugSpec; } public void setDrugSpec(String v) { this.drugSpec = v; }
    public String getDrugUnit() { return drugUnit; } public void setDrugUnit(String v) { this.drugUnit = v; }
    public String getBatchNo() { return batchNo; } public void setBatchNo(String v) { this.batchNo = v; }
    public Date getExpireDate() { return expireDate; } public void setExpireDate(Date v) { this.expireDate = v; }
    public int getQuantity() { return quantity; } public void setQuantity(int v) { this.quantity = v; }
    public int getReceivedQuantity() { return receivedQuantity; } public void setReceivedQuantity(int v) { this.receivedQuantity = v; }
    public BigDecimal getUnitPrice() { return unitPrice; } public void setUnitPrice(BigDecimal v) { this.unitPrice = v; }
    public BigDecimal getTotalPrice() { return totalPrice; } public void setTotalPrice(BigDecimal v) { this.totalPrice = v; }
    public BigDecimal getDiscountRatio() { return discountRatio; } public void setDiscountRatio(BigDecimal v) { this.discountRatio = v; }
    public BigDecimal getDiscountAmount() { return discountAmount; } public void setDiscountAmount(BigDecimal v) { this.discountAmount = v; }
    public BigDecimal getTaxRate() { return taxRate; } public void setTaxRate(BigDecimal v) { this.taxRate = v; }
    public BigDecimal getTaxAmount() { return taxAmount; } public void setTaxAmount(BigDecimal v) { this.taxAmount = v; }
    public Date getProductionDate() { return productionDate; } public void setProductionDate(Date v) { this.productionDate = v; }
    public String getManufacturer() { return manufacturer; } public void setManufacturer(String v) { this.manufacturer = v; }
    public String getStorageCondition() { return storageCondition; } public void setStorageCondition(String v) { this.storageCondition = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
}