package service;

import bean.Payroll;
import dao.PayrollDAO;
import dao.impl.PayrollDAOImpl;
import java.util.List;

public class PayrollService {
    private PayrollDAO dao = new PayrollDAOImpl();

    public int add(Payroll p) { return dao.insert(p); }
    public int update(Payroll p) { return dao.update(p); }
    public int voidPayroll(int id) { return dao.voidPayroll(id); }
    public Payroll getById(int id) { return dao.findById(id); }
    public List<Payroll> getAll(String period, Integer deptId) { return dao.findAll(period, deptId); }
}