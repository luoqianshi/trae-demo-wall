package bean;

import java.util.Date;

public class NurseRecord {
    private int id;
    private int inpatientId;
    private String patientName;
    private String content;
    private String nursingNotes;
    private int nurseId;
    private String nurseName;
    private Date recordTime;
    private String type;
    private String vitalSigns;
    private Date createTime;

    public NurseRecord() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getInpatientId() { return inpatientId; }
    public void setInpatientId(int inpatientId) { this.inpatientId = inpatientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getNursingNotes() { return nursingNotes; }
    public void setNursingNotes(String nursingNotes) { this.nursingNotes = nursingNotes; }

    public int getNurseId() { return nurseId; }
    public void setNurseId(int nurseId) { this.nurseId = nurseId; }

    public String getNurseName() { return nurseName; }
    public void setNurseName(String nurseName) { this.nurseName = nurseName; }

    public Date getRecordTime() { return recordTime; }
    public void setRecordTime(Date recordTime) { this.recordTime = recordTime; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getVitalSigns() { return vitalSigns; }
    public void setVitalSigns(String vitalSigns) { this.vitalSigns = vitalSigns; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
