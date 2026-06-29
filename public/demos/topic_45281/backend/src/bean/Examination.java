package bean;

import java.math.BigDecimal;
import java.util.Date;

public class Examination {
    private int id;
    private String name;
    private String category;
    private BigDecimal price;
    private String dept;
    private String remark;
    private Date createTime;

    public Examination() {}

    public Examination(int id, String name, String category, BigDecimal price, String dept, String remark, Date createTime) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.dept = dept;
        this.remark = remark;
        this.createTime = createTime;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
