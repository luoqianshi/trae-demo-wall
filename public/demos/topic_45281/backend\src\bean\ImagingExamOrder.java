package bean;
import java.math.BigDecimal;
import java.sql.Timestamp;

public class ImagingExamOrder {
    private int id; private String examNo; private int patientId; private String patientName;
    private String medicalRecordNo; private String admissionNo;
    private int doctorId; private String doctorName; private int deptId; private String deptName;
    private String examModality; private String examPart; private String examItems;
    private String clinicalDiagnosis; private String examPurpose;
    private String contrastAgent; private String allergyHistory;
    private String status = "已预约"; private Timestamp appointmentTime; private Timestamp examTime;
    private Integer technicianId; private String technicianName;
    private Integer radiologistId; private String radiologistName; private Timestamp reportTime;
    private int imageCount = 0; private String storagePath;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private Timestamp createTime; private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getExamNo() { return examNo; } public void setExamNo(String examNo) { this.examNo = examNo; }
    public int getPatientId() { return patientId; } public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; } public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getMedicalRecordNo() { return medicalRecordNo; } public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }
    public String getAdmissionNo() { return admissionNo; } public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getExamModality() { return examModality; } public void setExamModality(String examModality) { this.examModality = examModality; }
    public String getExamPart() { return examPart; } public void setExamPart(String examPart) { this.examPart = examPart; }
    public String getExamItems() { return examItems; } public void setExamItems(String examItems) { this.examItems = examItems; }
    public String getClinicalDiagnosis() { return clinicalDiagnosis; } public void setClinicalDiagnosis(String clinicalDiagnosis) { this.clinicalDiagnosis = clinicalDiagnosis; }
    public String getExamPurpose() { return examPurpose; } public void setExamPurpose(String examPurpose) { this.examPurpose = examPurpose; }
    public String getContrastAgent() { return contrastAgent; } public void setContrastAgent(String contrastAgent) { this.contrastAgent = contrastAgent; }
    public String getAllergyHistory() { return allergyHistory; } public void setAllergyHistory(String allergyHistory) { this.allergyHistory = allergyHistory; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public Timestamp getAppointmentTime() { return appointmentTime; } public void setAppointmentTime(Timestamp appointmentTime) { this.appointmentTime = appointmentTime; }
    public Timestamp getExamTime() { return examTime; } public void setExamTime(Timestamp examTime) { this.examTime = examTime; }
    public Integer getTechnicianId() { return technicianId; } public void setTechnicianId(Integer technicianId) { this.technicianId = technicianId; }
    public String getTechnicianName() { return technicianName; } public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
    public Integer getRadiologistId() { return radiologistId; } public void setRadiologistId(Integer radiologistId) { this.radiologistId = radiologistId; }
    public String getRadiologistName() { return radiologistName; } public void setRadiologistName(String radiologistName) { this.radiologistName = radiologistName; }
    public Timestamp getReportTime() { return reportTime; } public void setReportTime(Timestamp reportTime) { this.reportTime = reportTime; }
    public int getImageCount() { return imageCount; } public void setImageCount(int imageCount) { this.imageCount = imageCount; }
    public String getStoragePath() { return storagePath; } public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
    public BigDecimal getTotalAmount() { return totalAmount; } public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
