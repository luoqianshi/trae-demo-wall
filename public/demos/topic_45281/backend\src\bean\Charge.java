package bean;

import java.math.BigDecimal;
import java.util.Date;

public class Charge {
    private int id;
    private int patientId;
    private String patientName;
    private String chargeType;
    private int relateId;
    private BigDecimal totalFee;
    private Date chargeTime;
    private String operator;
    private String paymentType;
    private String status;

    public Charge() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getChargeType() { return chargeType; }
    public void setChargeType(String chargeType) { this.chargeType = chargeType; }

    public int getRelateId() { return relateId; }
    public void setRelateId(int relateId) { this.relateId = relateId; }

    public BigDecimal getTotalFee() { return totalFee; }
    public void setTotalFee(BigDecimal totalFee) { this.totalFee = totalFee; }

    public Date getChargeTime() { return chargeTime; }
    public void setChargeTime(Date chargeTime) { this.chargeTime = chargeTime; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
