package bean;

import java.math.BigDecimal;
import java.util.Date;

public class PrescriptionExamination {
    private int id;
    private int prescriptionId;
    private int examinationId;
    private String examinationName;
    private String category;
    private int quantity;
    private BigDecimal price;
    private BigDecimal totalPrice;
    private String status;
    private String result;
    private String dept;
    private String remark;
    private Date createTime;

    public PrescriptionExamination() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(int prescriptionId) { this.prescriptionId = prescriptionId; }

    public int getExaminationId() { return examinationId; }
    public void setExaminationId(int examinationId) { this.examinationId = examinationId; }

    public String getExaminationName() { return examinationName; }
    public void setExaminationName(String examinationName) { this.examinationName = examinationName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
}
