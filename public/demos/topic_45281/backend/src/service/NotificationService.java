package service;

import bean.Notification;
import dao.impl.NotificationDAOImpl;
import java.util.List;

public class NotificationService {
    private NotificationDAOImpl dao = new NotificationDAOImpl();

    public int add(Notification n) {
        return dao.insert(n);
    }

    public List<Notification> getByTarget(String targetType, int targetId, int unreadOnly, int page, int size) {
        return dao.findByTarget(targetType, targetId, unreadOnly, page, size);
    }

    public int countUnread(int userId) {
        return dao.countUnread(userId);
    }

    public int markRead(int notificationId, int userId) {
        return dao.markRead(notificationId, userId);
    }
}