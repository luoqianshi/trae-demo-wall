package bean;

import java.math.BigDecimal;
import java.util.Date;

public class DrugInventoryLedger {
    private int id; private int drugId; private String drugName; private String batchNo;
    private Date expireDate; private String warehouseType; private String warehouseName;
    private int quantity; private BigDecimal unitPrice; private BigDecimal totalAmount;
    private int minStock; private int maxStock; private String locationCode;
    private Date lastInTime; private Date lastOutTime; private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public int getDrugId() { return drugId; } public void setDrugId(int v) { this.drugId = v; }
    public String getDrugName() { return drugName; } public void setDrugName(String v) { this.drugName = v; }
    public String getBatchNo() { return batchNo; } public void setBatchNo(String v) { this.batchNo = v; }
    public Date getExpireDate() { return expireDate; } public void setExpireDate(Date v) { this.expireDate = v; }
    public String getWarehouseType() { return warehouseType; } public void setWarehouseType(String v) { this.warehouseType = v; }
    public String getWarehouseName() { return warehouseName; } public void setWarehouseName(String v) { this.warehouseName = v; }
    public int getQuantity() { return quantity; } public void setQuantity(int v) { this.quantity = v; }
    public BigDecimal getUnitPrice() { return unitPrice; } public void setUnitPrice(BigDecimal v) { this.unitPrice = v; }
    public BigDecimal getTotalAmount() { return totalAmount; } public void setTotalAmount(BigDecimal v) { this.totalAmount = v; }
    public int getMinStock() { return minStock; } public void setMinStock(int v) { this.minStock = v; }
    public int getMaxStock() { return maxStock; } public void setMaxStock(int v) { this.maxStock = v; }
    public String getLocationCode() { return locationCode; } public void setLocationCode(String v) { this.locationCode = v; }
    public Date getLastInTime() { return lastInTime; } public void setLastInTime(Date v) { this.lastInTime = v; }
    public Date getLastOutTime() { return lastOutTime; } public void setLastOutTime(Date v) { this.lastOutTime = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}