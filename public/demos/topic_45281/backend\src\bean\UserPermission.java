package bean;
import java.sql.Timestamp;
import java.math.BigDecimal;

public class UserPermission {
    private int id;
    private int userId;
    private String moduleCode;
    private String permissionType;
    private int grantedBy;
    private Timestamp grantTime;
    private Timestamp expireTime;
    private String status;
    private String remark;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public int getUserId() { return userId; } public void setUserId(int userId) { this.userId = userId; }
    public String getModuleCode() { return moduleCode; } public void setModuleCode(String moduleCode) { this.moduleCode = moduleCode; }
    public String getPermissionType() { return permissionType; } public void setPermissionType(String permissionType) { this.permissionType = permissionType; }
    public int getGrantedBy() { return grantedBy; } public void setGrantedBy(int grantedBy) { this.grantedBy = grantedBy; }
    public Timestamp getGrantTime() { return grantTime; } public void setGrantTime(Timestamp grantTime) { this.grantTime = grantTime; }
    public Timestamp getExpireTime() { return expireTime; } public void setExpireTime(Timestamp expireTime) { this.expireTime = expireTime; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getRemark() { return remark; } public void setRemark(String remark) { this.remark = remark; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
