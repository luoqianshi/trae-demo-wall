package bean;

import java.util.Date;

public class DrugTransferOrder {
    private int id; private String transferNo; private String sourceWarehouse; private String targetWarehouse;
    private String transferType; private int totalItems; private int totalQuantity; private String status;
    private int applicantId; private String applicantName; private int approverId; private String approverName;
    private Date approveTime; private int senderId; private String senderName; private Date sendTime;
    private int receiverId; private String receiverName; private Date receiveTime;
    private String remark; private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getTransferNo() { return transferNo; } public void setTransferNo(String v) { this.transferNo = v; }
    public String getSourceWarehouse() { return sourceWarehouse; } public void setSourceWarehouse(String v) { this.sourceWarehouse = v; }
    public String getTargetWarehouse() { return targetWarehouse; } public void setTargetWarehouse(String v) { this.targetWarehouse = v; }
    public String getTransferType() { return transferType; } public void setTransferType(String v) { this.transferType = v; }
    public int getTotalItems() { return totalItems; } public void setTotalItems(int v) { this.totalItems = v; }
    public int getTotalQuantity() { return totalQuantity; } public void setTotalQuantity(int v) { this.totalQuantity = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public int getApplicantId() { return applicantId; } public void setApplicantId(int v) { this.applicantId = v; }
    public String getApplicantName() { return applicantName; } public void setApplicantName(String v) { this.applicantName = v; }
    public int getApproverId() { return approverId; } public void setApproverId(int v) { this.approverId = v; }
    public String getApproverName() { return approverName; } public void setApproverName(String v) { this.approverName = v; }
    public Date getApproveTime() { return approveTime; } public void setApproveTime(Date v) { this.approveTime = v; }
    public int getSenderId() { return senderId; } public void setSenderId(int v) { this.senderId = v; }
    public String getSenderName() { return senderName; } public void setSenderName(String v) { this.senderName = v; }
    public Date getSendTime() { return sendTime; } public void setSendTime(Date v) { this.sendTime = v; }
    public int getReceiverId() { return receiverId; } public void setReceiverId(int v) { this.receiverId = v; }
    public String getReceiverName() { return receiverName; } public void setReceiverName(String v) { this.receiverName = v; }
    public Date getReceiveTime() { return receiveTime; } public void setReceiveTime(Date v) { this.receiveTime = v; }
    public String getRemark() { return remark; } public void setRemark(String v) { this.remark = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}