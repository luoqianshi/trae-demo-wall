package bean;
import java.sql.Timestamp;

public class LabTestResult {
    private int id; private int orderId; private String orderNo;
    private String itemCode; private String itemName; private String resultValue;
    private String resultText; private String unit; private String referenceRange;
    private int abnormalFlag = 0; private String abnormalMark; private String method;
    private String instrument; private String reagentLot;
    private Integer testerId; private String testerName;
    private Integer reviewerId; private String reviewerName; private Timestamp reviewTime;
    private String qualityControl = "合格"; private String remark;
    private Timestamp createTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public int getOrderId() { return orderId; } public void setOrderId(int orderId) { this.orderId = orderId; }
    public String getOrderNo() { return orderNo; } public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getItemCode() { return itemCode; } public void setItemCode(String itemCode) { this.itemCode = itemCode; }
    public String getItemName() { return itemName; } public void setItemName(String itemName) { this.itemName = itemName; }
    public String getResultValue() { return resultValue; } public void setResultValue(String resultValue) { this.resultValue = resultValue; }
    public String getResultText() { return resultText; } public void setResultText(String resultText) { this.resultText = resultText; }
    public String getUnit() { return unit; } public void setUnit(String unit) { this.unit = unit; }
    public String getReferenceRange() { return referenceRange; } public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }
    public int getAbnormalFlag() { return abnormalFlag; } public void setAbnormalFlag(int abnormalFlag) { this.abnormalFlag = abnormalFlag; }
    public String getAbnormalMark() { return abnormalMark; } public void setAbnormalMark(String abnormalMark) { this.abnormalMark = abnormalMark; }
    public String getMethod() { return method; } public void setMethod(String method) { this.method = method; }
    public String getInstrument() { return instrument; } public void setInstrument(String instrument) { this.instrument = instrument; }
    public String getReagentLot() { return reagentLot; } public void setReagentLot(String reagentLot) { this.reagentLot = reagentLot; }
    public Integer getTesterId() { return testerId; } public void setTesterId(Integer testerId) { this.testerId = testerId; }
    public String getTesterName() { return testerName; } public void setTesterName(String testerName) { this.testerName = testerName; }
    public Integer getReviewerId() { return reviewerId; } public void setReviewerId(Integer reviewerId) { this.reviewerId = reviewerId; }
    public String getReviewerName() { return reviewerName; } public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
    public Timestamp getReviewTime() { return reviewTime; } public void setReviewTime(Timestamp reviewTime) { this.reviewTime = reviewTime; }
    public String getQualityControl() { return qualityControl; } public void setQualityControl(String qualityControl) { this.qualityControl = qualityControl; }
    public String getRemark() { return remark; } public void setRemark(String remark) { this.remark = remark; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
}
