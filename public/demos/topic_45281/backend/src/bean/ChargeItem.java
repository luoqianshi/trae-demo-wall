package bean;

import java.math.BigDecimal;

public class ChargeItem {
    private int id;
    private int chargeId;
    private String itemType;
    private int relateId;
    private String itemName;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    public ChargeItem() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getChargeId() { return chargeId; }
    public void setChargeId(int chargeId) { this.chargeId = chargeId; }

    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }

    public int getRelateId() { return relateId; }
    public void setRelateId(int relateId) { this.relateId = relateId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
}
