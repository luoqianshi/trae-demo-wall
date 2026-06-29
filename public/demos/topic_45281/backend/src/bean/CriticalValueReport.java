package bean;
import java.sql.Timestamp;
import java.math.BigDecimal;

public class CriticalValueReport {
    private int id;
    private String reportNo;
    private int patientId;
    private String patientName;
    private String medicalRecordNo;
    private String admissionNo;
    private String valueType;
    private String itemName;
    private String itemValue;
    private String unit;
    private String referenceRange;
    private BigDecimal criticalLow;
    private BigDecimal criticalHigh;
    private int reporterId;
    private String reporterName;
    private Timestamp reportTime;
    private String notifyMethod;
    private Integer notifiedDoctorId;
    private String notifiedDoctorName;
    private Timestamp notifyTime;
    private Timestamp doctorConfirmTime;
    private String doctorResponse;
    private String handleMeasure;
    private Timestamp resolveTime;
    private String outcome;
    private String status;
    private int isUrgent;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getReportNo() { return reportNo; } public void setReportNo(String reportNo) { this.reportNo = reportNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public String getValueType() { return valueType; } public void setValueType(String valueType) { this.valueType = valueType; }
    public String getItemName() { return itemName; } public void setItemName(String itemName) { this.itemName = itemName; }
    public String getItemValue() { return itemValue; } public void setItemValue(String itemValue) { this.itemValue = itemValue; }
    public String getUnit() { return unit; } public void setUnit(String unit) { this.unit = unit; }
    public String getReferenceRange() { return referenceRange; } public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }
    public BigDecimal getCriticalLow() { return criticalLow; } public void setCriticalLow(BigDecimal criticalLow) { this.criticalLow = criticalLow; }
    public BigDecimal getCriticalHigh() { return criticalHigh; } public void setCriticalHigh(BigDecimal criticalHigh) { this.criticalHigh = criticalHigh; }
    public int getReporterId() { return reporterId; } public void setReporterId(int reporterId) { this.reporterId = reporterId; }
    public String getReporterName() { return reporterName; } public void setReporterName(String reporterName) { this.reporterName = reporterName; }
    public Timestamp getReportTime() { return reportTime; } public void setReportTime(Timestamp reportTime) { this.reportTime = reportTime; }
    public String getNotifyMethod() { return notifyMethod; } public void setNotifyMethod(String notifyMethod) { this.notifyMethod = notifyMethod; }
    public Integer getNotifiedDoctorId() { return notifiedDoctorId; } public void setNotifiedDoctorId(Integer notifiedDoctorId) { this.notifiedDoctorId = notifiedDoctorId; }
    public String getNotifiedDoctorName() { return notifiedDoctorName; } public void setNotifiedDoctorName(String notifiedDoctorName) { this.notifiedDoctorName = notifiedDoctorName; }
    public Timestamp getNotifyTime() { return notifyTime; } public void setNotifyTime(Timestamp notifyTime) { this.notifyTime = notifyTime; }
    public Timestamp getDoctorConfirmTime() { return doctorConfirmTime; } public void setDoctorConfirmTime(Timestamp doctorConfirmTime) { this.doctorConfirmTime = doctorConfirmTime; }
    public String getDoctorResponse() { return doctorResponse; } public void setDoctorResponse(String doctorResponse) { this.doctorResponse = doctorResponse; }
    public String getHandleMeasure() { return handleMeasure; } public void setHandleMeasure(String handleMeasure) { this.handleMeasure = handleMeasure; }
    public Timestamp getResolveTime() { return resolveTime; } public void setResolveTime(Timestamp resolveTime) { this.resolveTime = resolveTime; }
    public String getOutcome() { return outcome; } public void setOutcome(String outcome) { this.outcome = outcome; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public int getIsUrgent() { return isUrgent; } public void setIsUrgent(int isUrgent) { this.isUrgent = isUrgent; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
