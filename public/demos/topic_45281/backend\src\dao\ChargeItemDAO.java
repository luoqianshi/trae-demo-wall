package dao;

import bean.ChargeItem;
import java.util.List;

public interface ChargeItemDAO {
    int insert(ChargeItem item);
    List<ChargeItem> findByChargeId(int chargeId);
    List<ChargeItem> findAll();
    int deleteByChargeId(int chargeId);
}
