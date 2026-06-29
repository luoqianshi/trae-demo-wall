package bean;

import java.util.Date;

public class FileAsset {
    private long id;
    private String fileUuid;
    private String originalName;
    private String storagePath;
    private String mimeType;
    private long fileSize;
    private String fileSha256;
    private String category;
    private String ownerType;
    private Long ownerId;
    private Long uploadedBy;
    private Date uploadedAt;
    private int deleted;

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }
    public String getFileUuid() { return fileUuid; }
    public void setFileUuid(String fileUuid) { this.fileUuid = fileUuid; }
    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }
    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public String getFileSha256() { return fileSha256; }
    public void setFileSha256(String fileSha256) { this.fileSha256 = fileSha256; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getOwnerType() { return ownerType; }
    public void setOwnerType(String ownerType) { this.ownerType = ownerType; }
    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
    public Long getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(Long uploadedBy) { this.uploadedBy = uploadedBy; }
    public Date getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Date uploadedAt) { this.uploadedAt = uploadedAt; }
    public int getDeleted() { return deleted; }
    public void setDeleted(int deleted) { this.deleted = deleted; }
}
