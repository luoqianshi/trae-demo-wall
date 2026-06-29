package bean;

import java.util.Date;

public class Department {
    private int id;
    private String name;
    private String description;
    private Date createTime;

    public Department() {}

    public Department(int id, String name, String description, Date createTime) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createTime = createTime;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
