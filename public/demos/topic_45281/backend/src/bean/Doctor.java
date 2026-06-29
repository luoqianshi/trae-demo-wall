package bean;

import java.util.Date;

public class Doctor {
    private int id;
    private String workNo;
    private String name;
    private String dept;
    private Integer departmentId;
    private String title;
    private String role;
    private String gender;
    private int age;
    private String phone;
    private Date createTime;

    public Doctor() {}

    public Doctor(int id, String workNo, String name, String dept, String title, String role, Date createTime) {
        this.id = id;
        this.workNo = workNo;
        this.name = name;
        this.dept = dept;
        this.title = title;
        this.role = role;
        this.createTime = createTime;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getWorkNo() { return workNo; }
    public void setWorkNo(String workNo) { this.workNo = workNo; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public Integer getDepartmentId() { return departmentId; }
    public void setDepartmentId(Integer departmentId) { this.departmentId = departmentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
