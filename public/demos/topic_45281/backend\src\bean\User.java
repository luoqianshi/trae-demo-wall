package bean;

import java.util.Date;

public class User {
    private int id;
    private String username;
    private String password;
    private String role;
    private Integer relateId;
    private Date createTime;

    public User() {}

    public User(int id, String username, String password, String role, Integer relateId, Date createTime) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
        this.relateId = relateId;
        this.createTime = createTime;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getRelateId() { return relateId; }
    public void setRelateId(Integer relateId) { this.relateId = relateId; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
