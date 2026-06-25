package dao;

import bean.QueueTicket;
import java.util.List;

public interface QueueTicketDAO {
    int insert(QueueTicket t);
    int update(QueueTicket t);
    List<QueueTicket> findByTypeAndStatus(String type, String status);
    QueueTicket findCurrentCalling(String type, int deptId);
}
