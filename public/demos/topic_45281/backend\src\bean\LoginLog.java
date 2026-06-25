package bean;

import java.util.Date;

public class LoginLog {
    private long id;
    private Integer accountId;
    private String loginName;
    private String userType;
    private Date loginTime;
    private String loginIp;
    private String loginResult;
    private String failReason;
    private Date logoutTime;
    private Long sessionDuration;
    private String userAgent;

    public LoginLog() {}

    public long getId() { return id; }
    public void setId(long id) { this.id = id; }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public String getLoginName() { return loginName; }
    public void setLoginName(String loginName) { this.loginName = loginName; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public Date getLoginTime() { return loginTime; }
    public void setLoginTime(Date loginTime) { this.loginTime = loginTime; }

    public String getLoginIp() { return loginIp; }
    public void setLoginIp(String loginIp) { this.loginIp = loginIp; }

    public String getLoginResult() { return loginResult; }
    public void setLoginResult(String loginResult) { this.loginResult = loginResult; }

    public String getFailReason() { return failReason; }
    public void setFailReason(String failReason) { this.failReason = failReason; }

    public Date getLogoutTime() { return logoutTime; }
    public void setLogoutTime(Date logoutTime) { this.logoutTime = logoutTime; }

    public Long getSessionDuration() { return sessionDuration; }
    public void setSessionDuration(Long sessionDuration) { this.sessionDuration = sessionDuration; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
}