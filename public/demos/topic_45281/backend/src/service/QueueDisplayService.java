package service;

import bean.QueueDisplay;
import dao.QueueDisplayDAO;
import dao.impl.QueueDisplayDAOImpl;
import java.util.List;

public class QueueDisplayService {
    private QueueDisplayDAO dao = new QueueDisplayDAOImpl();

    public int addOrReplace(QueueDisplay q) { return dao.insertOrReplace(q); }
    public List<QueueDisplay> getByDept(Integer deptId) { return dao.findByDept(deptId); }
    public int delete(int id) { return dao.delete(id); }
}