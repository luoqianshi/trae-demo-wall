package dao;

import bean.FinanceBudget;
import java.util.List;

public interface FinanceBudgetDAO {
    int insert(FinanceBudget b);
    int update(FinanceBudget b);
    List<FinanceBudget> findAll(String year, Integer deptId);
    int voidBudget(int id);
    FinanceBudget findById(int id);
}