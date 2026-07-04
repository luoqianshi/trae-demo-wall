package bean;

import java.math.BigDecimal;
import java.util.Date;

public class DrugTransferItem {
    private int id; private int transferId; private int drugId; private String drugName;
    private String drugSpec; private String batchNo; private Date expireDate;
    private int quantity; private int receivedQuantity; private BigDecimal unitPrice;
    private BigDecimal totalPrice; private String remark; private Date createTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public int getTransferId() { return transferId; } public void setTransferId(int v) { this.transferId = v; }
    public int getDrugId() { return drugId; } public void setDrugId(int v) { this.drugId = v; }
    public String getDrugName() { return drugName; } public void setDrugName(String v) { this.drugName = v; }
    public String getDrugSpec() { return drugSpec; } public void setDrugSpec(String v) { this.drugSpec = v; }
    public String getBatchNo() { return batchNo; } public void setBatchNo(String v) { this.batchNo = v; }
    public Date getExpireDate() { return expireDate; } public void setExpireDate(Date v) { this.expireDate = v; }
    public int getQuantity() { return quantity; } public void setQuantity(int v) { this.quantity = v; }
    public int getReceivedQuantity() { return receivedQuantity; } public void setReceivedQuantity(int v) { this.receivedQuantity = v; }
    public BigDecimal getUnitPrice() { return unitPrice; } public void setUnitPrice(BigDecimal v) { this.unitPrice = v; }
    public BigDecimal getTotalPrice() { return totalPrice; } public void setTotalPrice(BigDecimal v) { this.totalPrice = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
}