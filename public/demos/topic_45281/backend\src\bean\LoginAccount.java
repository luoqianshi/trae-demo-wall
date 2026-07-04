package bean;

import java.util.Date;

public class LoginAccount {
    private int id;
    private String loginName;
    private String password;
    private String userType;
    private String status;
    private Integer relateId;
    private Date lastLoginTime;
    private String lastLoginIp;
    private int loginFailCount;
    private Date passwordUpdateTime;
    private Date createTime;
    private Date updateTime;

    public LoginAccount() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getLoginName() { return loginName; }
    public void setLoginName(String loginName) { this.loginName = loginName; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getRelateId() { return relateId; }
    public void setRelateId(Integer relateId) { this.relateId = relateId; }

    public Date getLastLoginTime() { return lastLoginTime; }
    public void setLastLoginTime(Date lastLoginTime) { this.lastLoginTime = lastLoginTime; }

    public String getLastLoginIp() { return lastLoginIp; }
    public void setLastLoginIp(String lastLoginIp) { this.lastLoginIp = lastLoginIp; }

    public int getLoginFailCount() { return loginFailCount; }
    public void setLoginFailCount(int loginFailCount) { this.loginFailCount = loginFailCount; }

    public Date getPasswordUpdateTime() { return passwordUpdateTime; }
    public void setPasswordUpdateTime(Date passwordUpdateTime) { this.passwordUpdateTime = passwordUpdateTime; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }
}