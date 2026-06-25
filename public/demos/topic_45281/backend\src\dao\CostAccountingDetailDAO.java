package dao;

import bean.CostAccountingDetail;
import java.util.List;

public interface CostAccountingDetailDAO {
    int insert(CostAccountingDetail d);
    List<CostAccountingDetail> findAll(String period, Integer deptId);
    int voidDetail(int id);
    int delete(int id);
    CostAccountingDetail findById(int id);
}