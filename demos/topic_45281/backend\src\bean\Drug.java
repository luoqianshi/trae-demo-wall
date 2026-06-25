package bean;

import java.math.BigDecimal;
import java.util.Date;

public class Drug {
    private int id;
    private String name;
    private String spec;
    private String unit;
    private int stock;
    private BigDecimal price;
    private int stockWarn;
    private Date expireDate;
    private Date createTime;
    private Date updateTime;
    private String remark;

    public Drug() {}

    public Drug(int id, String name, String spec, String unit, int stock, BigDecimal price, int stockWarn, Date expireDate, Date createTime, Date updateTime, String remark) {
        this.id = id;
        this.name = name;
        this.spec = spec;
        this.unit = unit;
        this.stock = stock;
        this.price = price;
        this.stockWarn = stockWarn;
        this.expireDate = expireDate;
        this.createTime = createTime;
        this.updateTime = updateTime;
        this.remark = remark;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpec() { return spec; }
    public void setSpec(String spec) { this.spec = spec; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public int getStockWarn() { return stockWarn; }
    public void setStockWarn(int stockWarn) { this.stockWarn = stockWarn; }

    public Date getExpireDate() { return expireDate; }
    public void setExpireDate(Date expireDate) { this.expireDate = expireDate; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public Date getUpdateTime() { return updateTime; }
    public void setUpdateTime(Date updateTime) { this.updateTime = updateTime; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
