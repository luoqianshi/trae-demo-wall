package bean;

import java.util.Date;

public class PatientIdentity {
    private long id;
    private long patientId;
    private String identityType;
    private String identityNo;
    private int verified;
    private int primaryFlag;
    private String status;
    private String source;
    private Date createdAt;
    private Date updatedAt;

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }

    public long getPatientId() { return patientId; }
    public void setPatientId(long patientId) { this.patientId = patientId; }

    public String getIdentityType() { return identityType; }
    public void setIdentityType(String identityType) { this.identityType = identityType; }

    public String getIdentityNo() { return identityNo; }
    public void setIdentityNo(String identityNo) { this.identityNo = identityNo; }

    public int getVerified() { return verified; }
    public void setVerified(int verified) { this.verified = verified; }

    public int getPrimaryFlag() { return primaryFlag; }
    public void setPrimaryFlag(int primaryFlag) { this.primaryFlag = primaryFlag; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
