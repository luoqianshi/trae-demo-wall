package service;

import bean.QueueTicket;
import dao.impl.QueueTicketDAOImpl;
import java.util.List;

public class QueueTicketService {
    private QueueTicketDAOImpl dao = new QueueTicketDAOImpl();

    public int add(QueueTicket t) {
        return dao.insert(t);
    }

    public List<QueueTicket> getByTypeAndStatus(String type, String status) {
        return dao.findByTypeAndStatus(type, status);
    }

    public QueueTicket findCurrentCalling(String type, int deptId) {
        return dao.findCurrentCalling(type, deptId);
    }

    public int update(QueueTicket t) {
        return dao.update(t);
    }
}