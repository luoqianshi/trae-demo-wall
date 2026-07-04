package dao;

import bean.Payroll;
import java.util.List;

public interface PayrollDAO {
    int insert(Payroll p);
    int update(Payroll p);
    List<Payroll> findAll(String period, Integer deptId);
    int voidPayroll(int id);
    Payroll findById(int id);
}