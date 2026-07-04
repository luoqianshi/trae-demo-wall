package service;

import bean.FinanceGeneralLedger;
import dao.FinanceGeneralLedgerDAO;
import dao.impl.FinanceGeneralLedgerDAOImpl;
import java.util.List;

public class FinanceGeneralLedgerService {
    private FinanceGeneralLedgerDAO dao = new FinanceGeneralLedgerDAOImpl();

    public int add(FinanceGeneralLedger l) { return dao.insert(l); }
    public int update(FinanceGeneralLedger l) { return dao.update(l); }
    public int voidEntry(int id) { return dao.voidEntry(id); }
    public FinanceGeneralLedger getById(int id) { return dao.findById(id); }
    public List<FinanceGeneralLedger> getAll(String period, String subject) { return dao.findAll(period, subject); }
}