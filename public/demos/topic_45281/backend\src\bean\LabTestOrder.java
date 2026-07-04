package bean;
import java.math.BigDecimal;
import java.sql.Timestamp;

public class LabTestOrder {
    private int id; private String orderNo; private int patientId; private String patientName;
    private String medicalRecordNo; private String admissionNo;
    private int doctorId; private String doctorName; private int deptId; private String deptName;
    private String testType; private String testItems; private String specimenType;
    private String specimenStatus = "未采集"; private Timestamp collectionTime;
    private Integer collectorId; private String collectorName; private Timestamp receiveTime;
    private String receiverName; private int urgentFlag = 0; private String diagnosis;
    private String clinicalNote; private String status = "待采样";
    private Timestamp reportTime; private BigDecimal totalAmount = BigDecimal.ZERO;
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getOrderNo() { return orderNo; } public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getTestType() { return testType; } public void setTestType(String testType) { this.testType = testType; }
    public String getTestItems() { return testItems; } public void setTestItems(String testItems) { this.testItems = testItems; }
    public String getSpecimenType() { return specimenType; } public void setSpecimenType(String specimenType) { this.specimenType = specimenType; }
    public String getSpecimenStatus() { return specimenStatus; } public void setSpecimenStatus(String specimenStatus) { this.specimenStatus = specimenStatus; }
    public Timestamp getCollectionTime() { return collectionTime; } public void setCollectionTime(Timestamp collectionTime) { this.collectionTime = collectionTime; }
    public Integer getCollectorId() { return collectorId; } public void setCollectorId(Integer collectorId) { this.collectorId = collectorId; }
    public String getCollectorName() { return collectorName; } public void setCollectorName(String collectorName) { this.collectorName = collectorName; }
    public Timestamp getReceiveTime() { return receiveTime; } public void setReceiveTime(Timestamp receiveTime) { this.receiveTime = receiveTime; }
    public String getReceiverName() { return receiverName; } public void setReceiverName(String receiverName) { this.receiverName = receiverName; }
    public int getUrgentFlag() { return urgentFlag; } public void setUrgentFlag(int urgentFlag) { this.urgentFlag = urgentFlag; }
    public String getDiagnosis() { return diagnosis; } public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    public String getClinicalNote() { return clinicalNote; } public void setClinicalNote(String clinicalNote) { this.clinicalNote = clinicalNote; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getReportTime() { return reportTime; } public void setReportTime(Timestamp reportTime) { this.reportTime = reportTime; }
    public BigDecimal getTotalAmount() { return totalAmount; } public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
