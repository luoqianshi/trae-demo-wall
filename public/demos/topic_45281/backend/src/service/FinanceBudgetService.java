package service;

import bean.FinanceBudget;
import dao.FinanceBudgetDAO;
import dao.impl.FinanceBudgetDAOImpl;
import java.util.List;

public class FinanceBudgetService {
    private FinanceBudgetDAO dao = new FinanceBudgetDAOImpl();

    public int add(FinanceBudget b) { return dao.insert(b); }
    public int update(FinanceBudget b) { return dao.update(b); }
    public int voidBudget(int id) { return dao.voidBudget(id); }
    public FinanceBudget getById(int id) { return dao.findById(id); }
    public List<FinanceBudget> getAll(String year, Integer deptId) { return dao.findAll(year, deptId); }
}