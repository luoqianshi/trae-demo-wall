package bean;
import java.math.BigDecimal;
import java.sql.Timestamp;

public class NursingRecord {
    private int id; private int inpatientId; private int patientId; private String patientName;
    private String admissionNo; private String bedNo; private String recordType;
    private Timestamp recordTime; private String recordLevel = "一级护理";
    private int nurseId; private String nurseName; private String vitalSigns;
    private String consciousness; private String diet; private BigDecimal intakeAmount;
    private BigDecimal outputAmount; private String conditionDescription;
    private String nursingMeasures; private String healthEducation;
    private Integer fallRiskScore; private Integer pressureInjuryRiskScore;
    private Integer painScore; private Integer adlScore;
    private String signature; private String electronicSignature;
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public int getInpatientId() { return inpatientId; } public void setInpatientId(int inpatientId) { this.inpatientId = inpatientId; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public String getBedNo() { return bedNo; } public void setBedNo(String bedNo) { this.bedNo = bedNo; }
    public String getRecordType() { return recordType; } public void setRecordType(String recordType) { this.recordType = recordType; }
    public Timestamp getRecordTime() { return recordTime; } public void setRecordTime(Timestamp recordTime) { this.recordTime = recordTime; }
    public String getRecordLevel() { return recordLevel; } public void setRecordLevel(String recordLevel) { this.recordLevel = recordLevel; }
    public int getNurseId() { return nurseId; } public void setNurseId(int nurseId) { this.nurseId = nurseId; }
    public String getNurseName() { return nurseName; } public void setNurseName(String nurseName) { this.nurseName = nurseName; }
    public String getVitalSigns() { return vitalSigns; } public void setVitalSigns(String vitalSigns) { this.vitalSigns = vitalSigns; }
    public String getConsciousness() { return consciousness; } public void setConsciousness(String consciousness) { this.consciousness = consciousness; }
    public String getDiet() { return diet; } public void setDiet(String diet) { this.diet = diet; }
    public BigDecimal getIntakeAmount() { return intakeAmount; } public void setIntakeAmount(BigDecimal intakeAmount) { this.intakeAmount = intakeAmount; }
    public BigDecimal getOutputAmount() { return outputAmount; } public void setOutputAmount(BigDecimal outputAmount) { this.outputAmount = outputAmount; }
    public String getConditionDescription() { return conditionDescription; } public void setConditionDescription(String conditionDescription) { this.conditionDescription = conditionDescription; }
    public String getNursingMeasures() { return nursingMeasures; } public void setNursingMeasures(String nursingMeasures) { this.nursingMeasures = nursingMeasures; }
    public String getHealthEducation() { return healthEducation; } public void setHealthEducation(String healthEducation) { this.healthEducation = healthEducation; }
    public Integer getFallRiskScore() { return fallRiskScore; } public void setFallRiskScore(Integer fallRiskScore) { this.fallRiskScore = fallRiskScore; }
    public Integer getPressureInjuryRiskScore() { return pressureInjuryRiskScore; } public void setPressureInjuryRiskScore(Integer pressureInjuryRiskScore) { this.pressureInjuryRiskScore = pressureInjuryRiskScore; }
    public Integer getPainScore() { return painScore; } public void setPainScore(Integer painScore) { this.painScore = painScore; }
    public Integer getAdlScore() { return adlScore; } public void setAdlScore(Integer adlScore) { this.adlScore = adlScore; }
    public String getSignature() { return signature; } public void setSignature(String signature) { this.signature = signature; }
    public String getElectronicSignature() { return electronicSignature; } public void setElectronicSignature(String electronicSignature) { this.electronicSignature = electronicSignature; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
