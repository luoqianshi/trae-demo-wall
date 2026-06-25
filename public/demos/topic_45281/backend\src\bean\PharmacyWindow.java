package bean;

import java.util.Date;

public class PharmacyWindow {
    private int id; private String windowNo; private String windowName; private String windowType;
    private int deptId; private String deptName; private String locationDesc;
    private int isActive; private Date createTime;

    public int getId() { return id; } public void setId(int v) { this.id = v; }
    public String getWindowNo() { return windowNo; } public void setWindowNo(String v) { this.windowNo = v; }
    public String getWindowName() { return windowName; } public void setWindowName(String v) { this.windowName = v; }
    public String getWindowType() { return windowType; } public void setWindowType(String v) { this.windowType = v; }
    public int getDeptId() { return deptId; } public void setDeptId(int v) { this.deptId = v; }
    public String getDeptName() { return deptName; } public void setDeptName(String v) { this.deptName = v; }
    public String getLocationDesc() { return locationDesc; } public void setLocationDesc(String v) { this.locationDesc = v; }
    public int getIsActive() { return isActive; } public void setIsActive(int v) { this.isActive = v; }
    public Date getCreateTime() { return createTime; } public void setCreateTime(Date v) { this.createTime = v; }
}