package bean;

import java.util.Date;

public class InventoryLog {
    private int id;
    private int drugId;
    private String changeType;
    private int changeNum;
    private int beforeStock;
    private int afterStock;
    private String operator;
    private Date changeTime;
    private String reason;

    public InventoryLog() {}

    public InventoryLog(int id, int drugId, String changeType, int changeNum, int beforeStock, int afterStock, String operator, Date changeTime, String reason) {
        this.id = id;
        this.drugId = drugId;
        this.changeType = changeType;
        this.changeNum = changeNum;
        this.beforeStock = beforeStock;
        this.afterStock = afterStock;
        this.operator = operator;
        this.changeTime = changeTime;
        this.reason = reason;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getDrugId() { return drugId; }
    public void setDrugId(int drugId) { this.drugId = drugId; }

    public String getChangeType() { return changeType; }
    public void setChangeType(String changeType) { this.changeType = changeType; }

    public int getChangeNum() { return changeNum; }
    public void setChangeNum(int changeNum) { this.changeNum = changeNum; }

    public int getBeforeStock() { return beforeStock; }
    public void setBeforeStock(int beforeStock) { this.beforeStock = beforeStock; }

    public int getAfterStock() { return afterStock; }
    public void setAfterStock(int afterStock) { this.afterStock = afterStock; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public Date getChangeTime() { return changeTime; }
    public void setChangeTime(Date changeTime) { this.changeTime = changeTime; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
