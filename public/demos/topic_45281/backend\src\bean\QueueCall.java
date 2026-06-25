package bean;

import java.util.Date;

public class QueueCall {
    private int id;
    private int registrationId;
    private int patientId;
    private String patientName;
    private String dept;
    private int doctorId;
    private String doctorName;
    private String queueNo;
    private Date queueTime;
    private String callStatus;
    private Date callTime;
    private String operator;

    public QueueCall() {}

    public QueueCall(int id, int registrationId, String dept, int doctorId, String queueNo, Date queueTime, String callStatus, Date callTime, String operator) {
        this.id = id;
        this.registrationId = registrationId;
        this.dept = dept;
        this.doctorId = doctorId;
        this.queueNo = queueNo;
        this.queueTime = queueTime;
        this.callStatus = callStatus;
        this.callTime = callTime;
        this.operator = operator;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getRegistrationId() { return registrationId; }
    public void setRegistrationId(int registrationId) { this.registrationId = registrationId; }

    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public int getDoctorId() { return doctorId; }
    public void setDoctorId(int doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getQueueNo() { return queueNo; }
    public void setQueueNo(String queueNo) { this.queueNo = queueNo; }

    public Date getQueueTime() { return queueTime; }
    public void setQueueTime(Date queueTime) { this.queueTime = queueTime; }

    public String getCallStatus() { return callStatus; }
    public void setCallStatus(String callStatus) { this.callStatus = callStatus; }

    public Date getCallTime() { return callTime; }
    public void setCallTime(Date callTime) { this.callTime = callTime; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }
}
