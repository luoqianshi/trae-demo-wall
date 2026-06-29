package bean;
import java.sql.Timestamp;

public class BloodTransfusionOrder {
    private int id; private String transfusionNo; private int patientId; private String patientName;
    private String admissionNo; private int doctorId; private String doctorName;
    private int deptId; private String deptName;
    private String bloodType; private String rhType; private String transfusionPurpose;
    private String productType; private int quantity; private String unit;
    private String urgency = "常规"; private java.sql.Date transfusionDate;
    private String aboAntibodyScreen; private String irregularAntibody; private String crossMatchResult;
    private String bloodBagNo; private String donorBloodType;
    private Timestamp startTime; private Timestamp endTime; private int transfusedAmount = 0;
    private String reactionType = "无"; private String reactionHandling;
    private String status = "待审批";
    private Integer approverId; private String approverName; private Timestamp approveTime;
    private Integer nurseId; private String nurseName;
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getTransfusionNo() { return transfusionNo; } public void setTransfusionNo(String transfusionNo) { this.transfusionNo = transfusionNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getBloodType() { return bloodType; } public void setBloodType(String bloodType) { this.bloodType = bloodType; }
    public String getRhType() { return rhType; } public void setRhType(String rhType) { this.rhType = rhType; }
    public String getTransfusionPurpose() { return transfusionPurpose; } public void setTransfusionPurpose(String transfusionPurpose) { this.transfusionPurpose = transfusionPurpose; }
    public String getProductType() { return productType; } public void setProductType(String productType) { this.productType = productType; }
    public int getQuantity() { return quantity; } public void setQuantity(int quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; } public void setUnit(String unit) { this.unit = unit; }
    public String getUrgency() { return urgency; } public void setUrgency(String urgency) { this.urgency = urgency; }
    public java.sql.Date getTransfusionDate() { return transfusionDate; } public void setTransfusionDate(java.sql.Date transfusionDate) { this.transfusionDate = transfusionDate; }
    public String getAboAntibodyScreen() { return aboAntibodyScreen; } public void setAboAntibodyScreen(String aboAntibodyScreen) { this.aboAntibodyScreen = aboAntibodyScreen; }
    public String getIrregularAntibody() { return irregularAntibody; } public void setIrregularAntibody(String irregularAntibody) { this.irregularAntibody = irregularAntibody; }
    public String getCrossMatchResult() { return crossMatchResult; } public void setCrossMatchResult(String crossMatchResult) { this.crossMatchResult = crossMatchResult; }
    public String getBloodBagNo() { return bloodBagNo; } public void setBloodBagNo(String bloodBagNo) { this.bloodBagNo = bloodBagNo; }
    public String getDonorBloodType() { return donorBloodType; } public void setDonorBloodType(String donorBloodType) { this.donorBloodType = donorBloodType; }
    public Timestamp getStartTime() { return startTime; } public void setStartTime(Timestamp startTime) { this.startTime = startTime; }
    public Timestamp getEndTime() { return endTime; } public void setEndTime(Timestamp endTime) { this.endTime = endTime; }
    public int getTransfusedAmount() { return transfusedAmount; } public void setTransfusedAmount(int transfusedAmount) { this.transfusedAmount = transfusedAmount; }
    public String getReactionType() { return reactionType; } public void setReactionType(String reactionType) { this.reactionType = reactionType; }
    public String getReactionHandling() { return reactionHandling; } public void setReactionHandling(String reactionHandling) { this.reactionHandling = reactionHandling; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Integer getApproverId() { return approverId; } public void setApproverId(Integer approverId) { this.approverId = approverId; }
    public String getApproverName() { return approverName; } public void setApproverName(String approverName) { this.approverName = approverName; }
    public Timestamp getApproveTime() { return approveTime; } public void setApproveTime(Timestamp approveTime) { this.approveTime = approveTime; }
    public Integer getNurseId() { return nurseId; } public void setNurseId(Integer nurseId) { this.nurseId = nurseId; }
    public String getNurseName() { return nurseName; } public void setNurseName(String nurseName) { this.nurseName = nurseName; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
