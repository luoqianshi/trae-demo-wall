package bean;
import java.sql.Timestamp;

public class SurgerySchedule {
    private int id; private String surgeryNo; private int patientId; private String patientName;
    private String admissionNo; private String bedNo;
    private int surgeonId; private String surgeonName;
    private String assistantIds; private String assistantNames;
    private Integer anesthesiologistId; private String anesthesiologistName;
    private Integer scrubNurseId; private String scrubNurseName;
    private Integer circulatingNurseId; private String circulatingNurseName;
    private String surgeryName; private String surgeryCode; private String surgeryType;
    private String bodySide; private String incisionType; private String anesthesiaMethod;
    private java.sql.Date plannedDate; private java.sql.Time plannedStartTime;
    private Integer operatingRoomId; private String operatingRoomName;
    private String preoperativeDiagnosis; private String surgeryIndication;
    private String riskLevel = "一般"; private String specialEquipment; private String bloodPreparation;
    private String status = "待排班";
    private Timestamp actualStartTime; private Timestamp actualEndTime;
    private int surgeryDuration = 0;
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getSurgeryNo() { return surgeryNo; } public void setSurgeryNo(String surgeryNo) { this.surgeryNo = surgeryNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public String getBedNo() { return bedNo; } public void setBedNo(String bedNo) { this.bedNo = bedNo; }
    public int getSurgeonId() { return surgeonId; } public void setSurgeonId(int surgeonId) { this.surgeonId = surgeonId; }
    public String getSurgeonName() { return surgeonName; } public void setSurgeonName(String surgeonName) { this.surgeonName = surgeonName; }
    public String getAssistantIds() { return assistantIds; } public void setAssistantIds(String assistantIds) { this.assistantIds = assistantIds; }
    public String getAssistantNames() { return assistantNames; } public void setAssistantNames(String assistantNames) { this.assistantNames = assistantNames; }
    public Integer getAnesthesiologistId() { return anesthesiologistId; } public void setAnesthesiologistId(Integer anesthesiologistId) { this.anesthesiologistId = anesthesiologistId; }
    public String getAnesthesiologistName() { return anesthesiologistName; } public void setAnesthesiologistName(String anesthesiologistName) { this.anesthesiologistName = anesthesiologistName; }
    public Integer getScrubNurseId() { return scrubNurseId; } public void setScrubNurseId(Integer scrubNurseId) { this.scrubNurseId = scrubNurseId; }
    public String getScrubNurseName() { return scrubNurseName; } public void setScrubNurseName(String scrubNurseName) { this.scrubNurseName = scrubNurseName; }
    public Integer getCirculatingNurseId() { return circulatingNurseId; } public void setCirculatingNurseId(Integer circulatingNurseId) { this.circulatingNurseId = circulatingNurseId; }
    public String getCirculatingNurseName() { return circulatingNurseName; } public void setCirculatingNurseName(String circulatingNurseName) { this.circulatingNurseName = circulatingNurseName; }
    public String getSurgeryName() { return surgeryName; } public void setSurgeryName(String surgeryName) { this.surgeryName = surgeryName; }
    public String getSurgeryCode() { return surgeryCode; } public void setSurgeryCode(String surgeryCode) { this.surgeryCode = surgeryCode; }
    public String getSurgeryType() { return surgeryType; } public void setSurgeryType(String surgeryType) { this.surgeryType = surgeryType; }
    public String getBodySide() { return bodySide; } public void setBodySide(String bodySide) { this.bodySide = bodySide; }
    public String getIncisionType() { return incisionType; } public void setIncisionType(String incisionType) { this.incisionType = incisionType; }
    public String getAnesthesiaMethod() { return anesthesiaMethod; } public void setAnesthesiaMethod(String anesthesiaMethod) { this.anesthesiaMethod = anesthesiaMethod; }
    public java.sql.Date getPlannedDate() { return plannedDate; } public void setPlannedDate(java.sql.Date plannedDate) { this.plannedDate = plannedDate; }
    public java.sql.Time getPlannedStartTime() { return plannedStartTime; } public void setPlannedStartTime(java.sql.Time plannedStartTime) { this.plannedStartTime = plannedStartTime; }
    public Integer getOperatingRoomId() { return operatingRoomId; } public void setOperatingRoomId(Integer operatingRoomId) { this.operatingRoomId = operatingRoomId; }
    public String getOperatingRoomName() { return operatingRoomName; } public void setOperatingRoomName(String operatingRoomName) { this.operatingRoomName = operatingRoomName; }
    public String getPreoperativeDiagnosis() { return preoperativeDiagnosis; } public void setPreoperativeDiagnosis(String preoperativeDiagnosis) { this.preoperativeDiagnosis = preoperativeDiagnosis; }
    public String getSurgeryIndication() { return surgeryIndication; } public void setSurgeryIndication(String surgeryIndication) { this.surgeryIndication = surgeryIndication; }
    public String getRiskLevel() { return riskLevel; } public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public String getSpecialEquipment() { return specialEquipment; } public void setSpecialEquipment(String specialEquipment) { this.specialEquipment = specialEquipment; }
    public String getBloodPreparation() { return bloodPreparation; } public void setBloodPreparation(String bloodPreparation) { this.bloodPreparation = bloodPreparation; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getActualStartTime() { return actualStartTime; } public void setActualStartTime(Timestamp actualStartTime) { this.actualStartTime = actualStartTime; }
    public Timestamp getActualEndTime() { return actualEndTime; } public void setActualEndTime(Timestamp actualEndTime) { this.actualEndTime = actualEndTime; }
    public int getSurgeryDuration() { return surgeryDuration; } public void setSurgeryDuration(int surgeryDuration) { this.surgeryDuration = surgeryDuration; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
