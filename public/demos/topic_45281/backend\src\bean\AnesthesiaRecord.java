package bean;
import java.sql.Timestamp;

public class AnesthesiaRecord {
    private int id; private int surgeryId; private String surgeryNo;
    private int patientId; private String patientName;
    private String asaGrade; private String anesthesiaMethod;
    private String preAnesthesiaVisit; private String inductionDrugs; private String maintenanceDrugs;
    private String vitalSignsMonitor; private String fluidInput;
    private int bloodLossMl = 0; private int urineOutputMl = 0;
    private Timestamp anesthesiaStartTime; private Timestamp anesthesiaEndTime;
    private String recoveryStatus; private int pacuStayMin = 0;
    private String complications; private String postAnesthesiaInstruction;
    private int anesthesiologistId; private String anesthesiologistName;
    private String signature;
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public int getSurgeryId() { return surgeryId; } public void setSurgeryId(int surgeryId) { this.surgeryId = surgeryId; }
    public String getSurgeryNo() { return surgeryNo; } public void setSurgeryNo(String surgeryNo) { this.surgeryNo = surgeryNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAsaGrade() { return asaGrade; } public void setAsaGrade(String asaGrade) { this.asaGrade = asaGrade; }
    public String getAnesthesiaMethod() { return anesthesiaMethod; } public void setAnesthesiaMethod(String anesthesiaMethod) { this.anesthesiaMethod = anesthesiaMethod; }
    public String getPreAnesthesiaVisit() { return preAnesthesiaVisit; } public void setPreAnesthesiaVisit(String preAnesthesiaVisit) { this.preAnesthesiaVisit = preAnesthesiaVisit; }
    public String getInductionDrugs() { return inductionDrugs; } public void setInductionDrugs(String inductionDrugs) { this.inductionDrugs = inductionDrugs; }
    public String getMaintenanceDrugs() { return maintenanceDrugs; } public void setMaintenanceDrugs(String maintenanceDrugs) { this.maintenanceDrugs = maintenanceDrugs; }
    public String getVitalSignsMonitor() { return vitalSignsMonitor; } public void setVitalSignsMonitor(String vitalSignsMonitor) { this.vitalSignsMonitor = vitalSignsMonitor; }
    public String getFluidInput() { return fluidInput; } public void setFluidInput(String fluidInput) { this.fluidInput = fluidInput; }
    public int getBloodLossMl() { return bloodLossMl; } public void setBloodLossMl(int bloodLossMl) { this.bloodLossMl = bloodLossMl; }
    public int getUrineOutputMl() { return urineOutputMl; } public void setUrineOutputMl(int urineOutputMl) { this.urineOutputMl = urineOutputMl; }
    public Timestamp getAnesthesiaStartTime() { return anesthesiaStartTime; } public void setAnesthesiaStartTime(Timestamp anesthesiaStartTime) { this.anesthesiaStartTime = anesthesiaStartTime; }
    public Timestamp getAnesthesiaEndTime() { return anesthesiaEndTime; } public void setAnesthesiaEndTime(Timestamp anesthesiaEndTime) { this.anesthesiaEndTime = anesthesiaEndTime; }
    public String getRecoveryStatus() { return recoveryStatus; } public void setRecoveryStatus(String recoveryStatus) { this.recoveryStatus = recoveryStatus; }
    public int getPacuStayMin() { return pacuStayMin; } public void setPacuStayMin(int pacuStayMin) { this.pacuStayMin = pacuStayMin; }
    public String getComplications() { return complications; } public void setComplications(String complications) { this.complications = complications; }
    public String getPostAnesthesiaInstruction() { return postAnesthesiaInstruction; } public void setPostAnesthesiaInstruction(String postAnesthesiaInstruction) { this.postAnesthesiaInstruction = postAnesthesiaInstruction; }
    public int getAnesthesiologistId() { return anesthesiologistId; } public void setAnesthesiologistId(int anesthesiologistId) { this.anesthesiologistId = anesthesiologistId; }
    public String getAnesthesiologistName() { return anesthesiologistName; } public void setAnesthesiologistName(String anesthesiologistName) { this.anesthesiologistName = anesthesiologistName; }
    public String getSignature() { return signature; } public void setSignature(String signature) { this.signature = signature; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
