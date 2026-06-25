package dao;

import bean.Notification;
import java.util.List;

public interface NotificationDAO {
    int insert(Notification n);
    List<Notification> findByTarget(String targetType, int targetId, int unreadOnly, int page, int size);
    int markRead(int notificationId, int userId);
    int countUnread(int userId);
}
