package bean;

import java.math.BigDecimal;
import java.util.Date;

public class DrugPurchaseOrder {
    private int id; private String purchaseNo; private int supplierId; private String supplierName;
    private String orderType; private BigDecimal totalAmount; private int drugCount; private int totalQuantity;
    private String orderStatus; private int inspectorId; private String inspectorName;
    private Date inspectionTime; private String inspectionResult; private int warehouseId;
    private String warehouseName; private int warehouserId; private String warehouserName;
    private Date warehouseTime; private String financeStatus; private Date financeTime;
    private Date orderDate; private int creatorId; private String creatorName;
    private String remark; private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getPurchaseNo() { return purchaseNo; } public void setPurchaseNo(String v) { this.purchaseNo = v; }
    public int getSupplierId() { return supplierId; } public void setSupplierId(int v) { this.supplierId = v; }
    public String getSupplierName() { return supplierName; } public void setSupplierName(String v) { this.supplierName = v; }
    public String getOrderType() { return orderType; } public void setOrderType(String v) { this.orderType = v; }
    public BigDecimal getTotalAmount() { return totalAmount; } public void setTotalAmount(BigDecimal v) { this.totalAmount = v; }
    public int getDrugCount() { return drugCount; } public void setDrugCount(int v) { this.drugCount = v; }
    public int getTotalQuantity() { return totalQuantity; } public void setTotalQuantity(int v) { this.totalQuantity = v; }
    public String getOrderStatus() { return orderStatus; } public void setOrderStatus(String v) { this.orderStatus = v; }
    public int getInspectorId() { return inspectorId; } public void setInspectorId(int v) { this.inspectorId = v; }
    public String getInspectorName() { return inspectorName; } public void setInspectorName(String v) { this.inspectorName = v; }
    public Date getInspectionTime() { return inspectionTime; } public void setInspectionTime(Date v) { this.inspectionTime = v; }
    public String getInspectionResult() { return inspectionResult; } public void setInspectionResult(String v) { this.inspectionResult = v; }
    public int getWarehouseId() { return warehouseId; } public void setWarehouseId(int v) { this.warehouseId = v; }
    public String getWarehouseName() { return warehouseName; } public void setWarehouseName(String v) { this.warehouseName = v; }
    public int getWarehouserId() { return warehouserId; } public void setWarehouserId(int v) { this.warehouserId = v; }
    public String getWarehouserName() { return warehouserName; } public void setWarehouserName(String v) { this.warehouserName = v; }
    public Date getWarehouseTime() { return warehouseTime; } public void setWarehouseTime(Date v) { this.warehouseTime = v; }
    public String getFinanceStatus() { return financeStatus; } public void setFinanceStatus(String v) { this.financeStatus = v; }
    public Date getFinanceTime() { return financeTime; } public void setFinanceTime(Date v) { this.financeTime = v; }
    public Date getOrderDate() { return orderDate; } public void setOrderDate(Date v) { this.orderDate = v; }
    public int getCreatorId() { return creatorId; } public void setCreatorId(int v) { this.creatorId = v; }
    public String getCreatorName() { return creatorName; } public void setCreatorName(String v) { this.creatorName = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}