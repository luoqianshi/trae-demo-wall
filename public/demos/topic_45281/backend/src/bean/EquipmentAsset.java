package bean;
import java.sql.Timestamp;
import java.math.BigDecimal;

public class EquipmentAsset {
    private int id;
    private String assetNo;
    private String assetName;
    private String assetType;
    private String category;
    private String brand;
    private String model;
    private String manufacturer;
    private java.sql.Date purchaseDate;
    private BigDecimal purchasePrice;
    private BigDecimal currentValue;
    private Integer deptId;
    private String deptName;
    private String location;
    private Integer custodianId;
    private String custodianName;
    private java.sql.Date warrantyExpire;
    private java.sql.Date lastMaintenanceDate;
    private java.sql.Date nextMaintenanceDate;
    private Integer maintenanceCycle;
    private String assetStatus;
    private String remark;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getAssetNo() { return assetNo; } public void setAssetNo(String assetNo) { this.assetNo = assetNo; }
    public String getAssetName() { return assetName; } public void setAssetName(String assetName) { this.assetName = assetName; }
    public String getAssetType() { return assetType; } public void setAssetType(String assetType) { this.assetType = assetType; }
    public String getCategory() { return category; } public void setCategory(String category) { this.category = category; }
    public String getBrand() { return brand; } public void setBrand(String brand) { this.brand = brand; }
    public String getModel() { return model; } public void setModel(String model) { this.model = model; }
    public String getManufacturer() { return manufacturer; } public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public java.sql.Date getPurchaseDate() { return purchaseDate; } public void setPurchaseDate(java.sql.Date purchaseDate) { this.purchaseDate = purchaseDate; }
    public BigDecimal getPurchasePrice() { return purchasePrice; } public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }
    public BigDecimal getCurrentValue() { return currentValue; } public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public Integer getDeptId() { return deptId; } public void setDeptId(Integer deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getLocation() { return location; } public void setLocation(String location) { this.location = location; }
    public Integer getCustodianId() { return custodianId; } public void setCustodianId(Integer custodianId) { this.custodianId = custodianId; }
    public String getCustodianName() { return custodianName; } public void setCustodianName(String custodianName) { this.custodianName = custodianName; }
    public java.sql.Date getWarrantyExpire() { return warrantyExpire; } public void setWarrantyExpire(java.sql.Date warrantyExpire) { this.warrantyExpire = warrantyExpire; }
    public java.sql.Date getLastMaintenanceDate() { return lastMaintenanceDate; } public void setLastMaintenanceDate(java.sql.Date lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; }
    public java.sql.Date getNextMaintenanceDate() { return nextMaintenanceDate; } public void setNextMaintenanceDate(java.sql.Date nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }
    public Integer getMaintenanceCycle() { return maintenanceCycle; } public void setMaintenanceCycle(Integer maintenanceCycle) { this.maintenanceCycle = maintenanceCycle; }
    public String getAssetStatus() { return assetStatus; } public void setAssetStatus(String assetStatus) { this.assetStatus = assetStatus; }
    public String getRemark() { return remark; } public void setRemark(String remark) { this.remark = remark; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
