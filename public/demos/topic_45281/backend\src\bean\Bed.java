package bean;

import java.math.BigDecimal;

public class Bed {
    private int id;
    private String bedNo;
    private String dept;
    private String status;
    private String type;
    private int currentPatientId;
    private String currentPatientName;
    private BigDecimal dailyFee;

    public Bed() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getBedNo() { return bedNo; }
    public void setBedNo(String bedNo) { this.bedNo = bedNo; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getCurrentPatientId() { return currentPatientId; }
    public void setCurrentPatientId(int currentPatientId) { this.currentPatientId = currentPatientId; }

    public String getCurrentPatientName() { return currentPatientName; }
    public void setCurrentPatientName(String currentPatientName) { this.currentPatientName = currentPatientName; }

    public BigDecimal getDailyFee() { return dailyFee; }
    public void setDailyFee(BigDecimal dailyFee) { this.dailyFee = dailyFee; }
}