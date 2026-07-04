package bean;

import java.util.Date;

public class ClinicalAttachment {
    private long id;
    private long patientId;
    private Long visitId;
    private Long recordId;
    private long fileId;
    private String attachmentType;
    private String remark;
    private Date createdAt;
    private FileAsset file;

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public long getPatientId() { return patientId; }
    public void setPatientId(long patientId) { this.patientId = patientId; }
    public Long getVisitId() { return visitId; }
    public void setVisitId(Long visitId) { this.visitId = visitId; }
    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public long getFileId() { return fileId; }
    public void setFileId(long fileId) { this.fileId = fileId; }
    public String getAttachmentType() { return attachmentType; }
    public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public FileAsset getFile() { return file; }
    public void setFile(FileAsset file) { this.file = file; }
}
