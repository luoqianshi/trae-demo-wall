package bean;

import java.util.Date;

public class Specimen {
    private int id; private String barcode; private int orderId; private int patientId;
    private String patientName; private String specimenType; private String specimenName;
    private String collectionMethod; private Date collectionTime; private String collectorName;
    private String bodyPart; private String container; private String status;
    private Date receiveTime; private String receiverName; private String labDept;
    private Date testTime; private String testerName; private Date reportTime;
    private String rejectReason; private Date createTime; private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getBarcode() { return barcode; } public void setBarcode(String v) { this.barcode = v; }
    public int getOrderId() { return orderId; } public void setOrderId(int v) { this.orderId = v; }
    public int getPatientId() { return patientId; } public void setPatientId(int v) { this.patientId = v; }
    public String getPatientName() { return patientName; } public void setPatientName(String v) { this.patientName = v; }
    public String getSpecimenType() { return specimenType; } public void setSpecimenType(String v) { this.specimenType = v; }
    public String getSpecimenName() { return specimenName; } public void setSpecimenName(String v) { this.specimenName = v; }
    public String getCollectionMethod() { return collectionMethod; } public void setCollectionMethod(String v) { this.collectionMethod = v; }
    public Date getCollectionTime() { return collectionTime; } public void setCollectionTime(Date v) { this.collectionTime = v; }
    public String getCollectorName() { return collectorName; } public void setCollectorName(String v) { this.collectorName = v; }
    public String getBodyPart() { return bodyPart; } public void setBodyPart(String v) { this.bodyPart = v; }
    public String getContainer() { return container; } public void setContainer(String v) { this.container = v; }
    public String getStatus() { return status; } public void setStatus(String v) { this.status = v; }
    public Date getReceiveTime() { return receiveTime; } public void setReceiveTime(Date v) { this.receiveTime = v; }
    public String getReceiverName() { return receiverName; } public void setReceiverName(String v) { this.receiverName = v; }
    public String getLabDept() { return labDept; } public void setLabDept(String v) { this.labDept = v; }
    public Date getTestTime() { return testTime; } public void setTestTime(Date v) { this.testTime = v; }
    public String getTesterName() { return testerName; } public void setTesterName(String v) { this.testerName = v; }
    public Date getReportTime() { return reportTime; } public void setReportTime(Date v) { this.reportTime = v; }
    public String getRejectReason() { return rejectReason; } public void setRejectReason(String v) { this.rejectReason = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}