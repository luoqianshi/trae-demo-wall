package bean;
import java.sql.Timestamp;

public class HrStaff {
    private int id;
    private String staffNo;
    private String name;
    private String gender;
    private java.sql.Date birthDate;
    private String idCard;
    private String phone;
    private String email;
    private int deptId;
    private String deptName;
    private String position;
    private String title;
    private String education;
    private java.sql.Date hireDate;
    private java.sql.Date leaveDate;
    private String staffType;
    private String salaryLevel;
    private String skillCertificates;
    private String workStatus;
    private String emergencyContact;
    private String emergencyPhone;
    private String remark;
    private Timestamp createTime;
    private Timestamp updateTime;

    public int getId() { return id; } public void setId(int id) { this.id = id; }
    public String getStaffNo() { return staffNo; } public void setStaffNo(String staffNo) { this.staffNo = staffNo; }
    public String getName() { return name; } public void setName(String name) { this.name = name; }
    public String getGender() { return gender; } public void setGender(String gender) { this.gender = gender; }
    public java.sql.Date getBirthDate() { return birthDate; } public void setBirthDate(java.sql.Date birthDate) { this.birthDate = birthDate; }
    public String getIdCard() { return idCard; } public void setIdCard(String idCard) { this.idCard = idCard; }
    public String getPhone() { return phone; } public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
    public int getDeptId() { return deptId; } public void setDeptId(int deptId) { this.deptId = deptId; }
    public String getDeptName() { return deptName; } public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getPosition() { return position; } public void setPosition(String position) { this.position = position; }
    public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
    public String getEducation() { return education; } public void setEducation(String education) { this.education = education; }
    public java.sql.Date getHireDate() { return hireDate; } public void setHireDate(java.sql.Date hireDate) { this.hireDate = hireDate; }
    public java.sql.Date getLeaveDate() { return leaveDate; } public void setLeaveDate(java.sql.Date leaveDate) { this.leaveDate = leaveDate; }
    public String getStaffType() { return staffType; } public void setStaffType(String staffType) { this.staffType = staffType; }
    public String getSalaryLevel() { return salaryLevel; } public void setSalaryLevel(String salaryLevel) { this.salaryLevel = salaryLevel; }
    public String getSkillCertificates() { return skillCertificates; } public void setSkillCertificates(String skillCertificates) { this.skillCertificates = skillCertificates; }
    public String getWorkStatus() { return workStatus; } public void setWorkStatus(String workStatus) { this.workStatus = workStatus; }
    public String getEmergencyContact() { return emergencyContact; } public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    public String getEmergencyPhone() { return emergencyPhone; } public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }
    public String getRemark() { return remark; } public void setRemark(String remark) { this.remark = remark; }
    public Timestamp getCreateTime() { return createTime; } public void setCreateTime(Timestamp createTime) { this.createTime = createTime; }
    public Timestamp getUpdateTime() { return updateTime; } public void setUpdateTime(Timestamp updateTime) { this.updateTime = updateTime; }
}
