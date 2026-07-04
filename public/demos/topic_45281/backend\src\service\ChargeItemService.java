package service;

import bean.ChargeItem;
import dao.ChargeItemDAO;
import dao.impl.ChargeItemDAOImpl;
import java.util.List;

public class ChargeItemService {
    private ChargeItemDAO chargeItemDAO = new ChargeItemDAOImpl();

    public int addChargeItem(ChargeItem item) {
        return chargeItemDAO.insert(item);
    }

    public List<ChargeItem> getByChargeId(int chargeId) {
        return chargeItemDAO.findByChargeId(chargeId);
    }

    public List<ChargeItem> getAll() {
        return chargeItemDAO.findAll();
    }

    public int deleteByChargeId(int chargeId) {
        return chargeItemDAO.deleteByChargeId(chargeId);
    }
}
