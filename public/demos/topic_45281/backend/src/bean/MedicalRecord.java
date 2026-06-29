package bean;

import java.util.Date;

public class MedicalRecord {
    private int id;
    private int patientId;
    private int doctorId;
    private int registrationId;
    private String chiefComplaint;
    private String presentIllness;
    private String pastHistory;
    private String physicalExam;
    private String diagnosis;
    private String treatment;
    private String treatmentPlan;
    private String content;
    private Date createTime;
    private Date updateTime;

    public MedicalRecord() {}

    public MedicalRecord(int id, int patientId, int doctorId, int registrationId, String chiefComplaint, String presentIllness, String pastHistory, String physicalExam, String diagnosis, String treatmentPlan, String content, Date createTime, Date updateTime) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.registrationId = registrationId;
        this.chiefComplaint = chiefComplaint;
        this.presentIllness = presentIllness;
        this.pastHistory = pastHistory;
        this.physicalExam = physicalExam;
        this.diagnosis = diagnosis;
        this.treatmentPlan = treatmentPlan;
        this.content = content;
        this.createTime = createTime;
        this.updateTime = updateTime;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }

    public int getDoctorId() { return doctorId; }
    public void setDoctorId(int doctorId) { this.doctorId = doctorId; }

    public int getRegistrationId() { return registrationId; }
    public void setRegistrationId(int registrationId) { this.registrationId = registrationId; }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getPresentIllness() { return presentIllness; }
    public void setPresentIllness(String presentIllness) { this.presentIllness = presentIllness; }

    public String getPastHistory() { return pastHistory; }
    public void setPastHistory(String pastHistory) { this.pastHistory = pastHistory; }

    public String getPhysicalExam() { return physicalExam; }
    public void setPhysicalExam(String physicalExam) { this.physicalExam = physicalExam; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getTreatment() { return treatment; }
    public void setTreatment(String treatment) { this.treatment = treatment; }

    public String getTreatmentPlan() { return treatmentPlan; }
    public void setTreatmentPlan(String treatmentPlan) { this.treatmentPlan = treatmentPlan; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }
}
