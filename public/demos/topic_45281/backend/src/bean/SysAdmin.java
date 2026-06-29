package bean;

import java.util.Date;

public class SysAdmin {
    private int id;
    private String adminName;
    private int loginAccountId;
    private int departmentId;
    private String phone;
    private String email;
    private Date createTime;

    public SysAdmin() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

    public int getLoginAccountId() { return loginAccountId; }
    public void setLoginAccountId(int loginAccountId) { this.loginAccountId = loginAccountId; }

    public int getDepartmentId() { return departmentId; }
    public void setDepartmentId(int departmentId) { this.departmentId = departmentId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}