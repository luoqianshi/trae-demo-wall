package bean;

import java.math.BigDecimal;

public class PrescriptionItem {
    private int id;
    private int prescriptionId;
    private int drugId;
    private int num;
    private BigDecimal drugPrice;
    private String usage;
    private int days;
    private String drugName;
    private String drugSpec;

    public PrescriptionItem() {}

    public PrescriptionItem(int id, int prescriptionId, int drugId, int num, BigDecimal drugPrice, String usage, int days) {
        this.id = id;
        this.prescriptionId = prescriptionId;
        this.drugId = drugId;
        this.num = num;
        this.drugPrice = drugPrice;
        this.usage = usage;
        this.days = days;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(int prescriptionId) { this.prescriptionId = prescriptionId; }

    public int getDrugId() { return drugId; }
    public void setDrugId(int drugId) { this.drugId = drugId; }

    public int getNum() { return num; }
    public void setNum(int num) { this.num = num; }

    public BigDecimal getDrugPrice() { return drugPrice; }
    public void setDrugPrice(BigDecimal drugPrice) { this.drugPrice = drugPrice; }

    public String getUsage() { return usage; }
    public void setUsage(String usage) { this.usage = usage; }

    public int getDays() { return days; }
    public void setDays(int days) { this.days = days; }

    public String getDrugName() { return drugName; }
    public void setDrugName(String drugName) { this.drugName = drugName; }

    public String getDrugSpec() { return drugSpec; }
    public void setDrugSpec(String drugSpec) { this.drugSpec = drugSpec; }
}
