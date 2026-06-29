package service;

import bean.CostAccountingDetail;
import dao.CostAccountingDetailDAO;
import dao.impl.CostAccountingDetailDAOImpl;
import java.util.List;

public class CostAccountingDetailService {
    private CostAccountingDetailDAO dao = new CostAccountingDetailDAOImpl();

    public int add(CostAccountingDetail d) { return dao.insert(d); }
    public int voidDetail(int id) { return dao.voidDetail(id); }
    public CostAccountingDetail getById(int id) { return dao.findById(id); }
    public List<CostAccountingDetail> getAll(String period, Integer deptId) { return dao.findAll(period, deptId); }
    public int delete(int id) { return dao.delete(id); }
}