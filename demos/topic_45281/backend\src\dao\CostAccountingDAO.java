package dao;
import bean.CostAccounting;
import java.util.List;
public interface CostAccountingDAO {
    int insert(CostAccounting c);
    int update(CostAccounting c);
    CostAccounting findById(int id);
    List<CostAccounting> findByDeptId(int deptId);
    List<CostAccounting> findAccounts(String accountPeriod, String status, int page, int size);
}
