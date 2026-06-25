package dao;

import bean.FinanceGeneralLedger;
import java.util.List;

public interface FinanceGeneralLedgerDAO {
    int insert(FinanceGeneralLedger l);
    int update(FinanceGeneralLedger l);
    List<FinanceGeneralLedger> findAll(String period, String subject);
    int voidEntry(int id);
    FinanceGeneralLedger findById(int id);
}