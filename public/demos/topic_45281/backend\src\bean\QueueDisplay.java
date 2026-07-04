package bean;

import java.util.Date;

public class QueueDisplay {
    private int id; private int deptId; private String deptName; private int doctorId;
    private String doctorName; private String doctorRoom; private String currentQueueNo;
    private String currentPatientName; private String waitingList; private String displayStatus;
    private Date updateTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public int getDeptId() { return deptId; } public void setDeptId(int v) { this.deptId = v; }
    public String getDeptName() { return deptName; } public void setDeptName(String v) { this.deptName = v; }
    public int getDoctorId() { return doctorId; } public void setDoctorId(int v) { this.doctorId = v; }
    public String getDoctorName() { return doctorName; } public void setDoctorName(String v) { this.doctorName = v; }
    public String getDoctorRoom() { return doctorRoom; } public void setDoctorRoom(String v) { this.doctorRoom = v; }
    public String getCurrentQueueNo() { return currentQueueNo; } public void setCurrentQueueNo(String v) { this.currentQueueNo = v; }
    public String getCurrentPatientName() { return currentPatientName; } public void setCurrentPatientName(String v) { this.currentPatientName = v; }
    public String getWaitingList() { return waitingList; } public void setWaitingList(String v) { this.waitingList = v; }
    public String getDisplayStatus() { return displayStatus; } public void setDisplayStatus(String v) { this.displayStatus = v; }
    public Date getUpdateTime() { return updateTime; } public void setUpdateTime(Date v) { this.updateTime = v; }
}