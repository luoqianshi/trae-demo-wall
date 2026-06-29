package bean;

import java.util.Date;

public class PatientLocation {
    private int id;
    private int patientId;
    private String patientName;
    private String locationType;
    private String areaName;
    private String roomNo;
    private String floor;
    private String building;
    private Date checkInTime;
    private Date checkOutTime;
    private String status;
    private String remark;
    private Date createTime;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getLocationType() { return locationType; }
    public void setLocationType(String locationType) { this.locationType = locationType; }
    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }
    public String getRoomNo() { return roomNo; }
    public void setRoomNo(String roomNo) { this.roomNo = roomNo; }
    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }
    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }
    public Date getCheckInTime() { return checkInTime; }
    public void setCheckInTime(Date checkInTime) { this.checkInTime = checkInTime; }
    public Date getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(Date checkOutTime) { this.checkOutTime = checkOutTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
