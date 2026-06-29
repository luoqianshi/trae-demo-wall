package bean;

import java.math.BigDecimal;
import java.util.Date;

public class Prescription {
    private int id;
    private int patientId;
    private int doctorId;
    private int registrationId;
    private String diagnosis;
    private String items;
    private BigDecimal totalPrice;
    private Date createTime;
    private String status;
    private String doctorName;
    private String patientName;

    public Prescription() {}

    public Prescription(int id, int patientId, int doctorId, int registrationId, BigDecimal totalPrice, Date createTime, String status) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.registrationId = registrationId;
        this.totalPrice = totalPrice;
        this.createTime = createTime;
        this.status = status;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }

    public int getDoctorId() { return doctorId; }
    public void setDoctorId(int doctorId) { this.doctorId = doctorId; }

    public int getRegistrationId() { return registrationId; }
    public void setRegistrationId(int registrationId) { this.registrationId = registrationId; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getItems() { return items; }
    public void setItems(String items) { this.items = items; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
}
