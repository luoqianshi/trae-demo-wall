package bean;

import java.util.Date;

public class VitalSign {
    private int id;
    private int inpatientId;
    private String patientName;
    private double temperature;
    private int pulse;
    private int bloodPressureHigh;
    private int bloodPressureLow;
    private int oxygenSaturation;
    private int respiration;
    private Date recordTime;
    private String nurseName;

    public VitalSign() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getInpatientId() { return inpatientId; }
    public void setInpatientId(int inpatientId) { this.inpatientId = inpatientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public int getPulse() { return pulse; }
    public void setPulse(int pulse) { this.pulse = pulse; }

    public int getBloodPressureHigh() { return bloodPressureHigh; }
    public void setBloodPressureHigh(int bloodPressureHigh) { this.bloodPressureHigh = bloodPressureHigh; }

    public int getBloodPressureLow() { return bloodPressureLow; }
    public void setBloodPressureLow(int bloodPressureLow) { this.bloodPressureLow = bloodPressureLow; }

    public int getOxygenSaturation() { return oxygenSaturation; }
    public void setOxygenSaturation(int oxygenSaturation) { this.oxygenSaturation = oxygenSaturation; }

    public int getRespiration() { return respiration; }
    public void setRespiration(int respiration) { this.respiration = respiration; }

    public Date getRecordTime() { return recordTime; }
    public void setRecordTime(Date recordTime) { this.recordTime = recordTime; }

    public String getNurseName() { return nurseName; }
    public void setNurseName(String nurseName) { this.nurseName = nurseName; }
}