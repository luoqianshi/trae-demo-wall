package bean;

import java.util.Date;

public class MedicalRecordVersion {
    private int id;
    private int recordId;
    private String content;
    private Date updateTime;
    private int operatorId;

    public MedicalRecordVersion() {}

    public MedicalRecordVersion(int id, int recordId, String content, Date updateTime, int operatorId) {
        this.id = id;
        this.recordId = recordId;
        this.content = content;
        this.updateTime = updateTime;
        this.operatorId = operatorId;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getRecordId() { return recordId; }
    public void setRecordId(int recordId) { this.recordId = recordId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }

    public int getOperatorId() { return operatorId; }
    public void setOperatorId(int operatorId) { this.operatorId = operatorId; }
}
