package bean;

import java.util.Date;

public class MedicalRecordArchive {
    private int id;
    private int medicalRecordId;
    private int patientId;
    private String patientName;
    private int recordId;
    private String icdCode;
    private String icdName;
    private int qualityScore;
    private String archiveStatus;
    private String archivist;
    private Date archiveDate;
    private Date createTime;
    private String remark;

    public MedicalRecordArchive() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getMedicalRecordId() { return medicalRecordId; }
    public void setMedicalRecordId(int medicalRecordId) { this.medicalRecordId = medicalRecordId; }

    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public int getRecordId() { return recordId; }
    public void setRecordId(int recordId) { this.recordId = recordId; }

    public String getIcdCode() { return icdCode; }
    public void setIcdCode(String icdCode) { this.icdCode = icdCode; }

    public String getIcdName() { return icdName; }
    public void setIcdName(String icdName) { this.icdName = icdName; }

    public int getQualityScore() { return qualityScore; }
    public void setQualityScore(int qualityScore) { this.qualityScore = qualityScore; }

    public String getArchiveStatus() { return archiveStatus; }
    public void setArchiveStatus(String archiveStatus) { this.archiveStatus = archiveStatus; }

    public String getArchivist() { return archivist; }
    public void setArchivist(String archivist) { this.archivist = archivist; }

    public Date getArchiveDate() { return archiveDate; }
    public void setArchiveDate(Date archiveDate) { this.archiveDate = archiveDate; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
