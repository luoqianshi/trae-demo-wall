package dao.impl;

import bean.Notification;
import dao.NotificationDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class NotificationDAOImpl implements NotificationDAO {

    private List<Notification> queryNotifs(String sql, Object... params) {
        List<Notification> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapNotification(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override public int insert(Notification n) {
        return JDBCUtil.executeInsert("INSERT INTO notification(title,content,notify_type,target_type,target_id,target_name,sender_id,sender_name,send_channel,is_read) VALUES(?,?,?,?,?,?,?,?,?,?)",
            n.getTitle(), n.getContent(), n.getNotifyType(), n.getTargetType(), n.getTargetId(), n.getTargetName(),
            n.getSenderId(), n.getSenderName(), n.getSendChannel(), n.getIsRead());
    }
    @Override public List<Notification> findByTarget(String targetType, int targetId, int unreadOnly, int page, int size) {
        String sql = "SELECT * FROM notification WHERE 1=1";
        List<Object> params = new ArrayList<>();
        if (targetType != null && !targetType.equals("全体")) {
            sql += " AND target_type=? AND target_id=?";
            params.add(targetType); params.add(targetId);
        }
        if (unreadOnly == 1) sql += " AND is_read=0";
        sql += " ORDER BY create_time DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryNotifs(sql, params.toArray());
    }
    @Override
    public int markRead(int notificationId, int userId) {
        try {
            JDBCUtil.executeUpdate(
                "INSERT INTO notification_read(notification_id,user_id) VALUES(?,?) ON DUPLICATE KEY UPDATE notification_id=notification_id",
                notificationId, userId);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return JDBCUtil.executeUpdate("UPDATE notification SET is_read=1,read_time=NOW() WHERE id=?", notificationId);
    }
    @Override public int countUnread(int userId) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(
            "SELECT COUNT(*) as cnt FROM notification n LEFT JOIN notification_read nr ON n.id=nr.notification_id AND nr.user_id=? WHERE nr.id IS NULL", userId)) {
            if (qr != null && qr.getResultSet().next()) { return qr.getResultSet().getInt("cnt"); }
        } catch (Exception e) { e.printStackTrace(); }
        return 0;
    }

    private Notification mapNotification(ResultSet rs) throws SQLException {
        Notification n = new Notification();
        n.setId(rs.getInt("id")); n.setTitle(rs.getString("title")); n.setContent(rs.getString("content"));
        n.setNotifyType(rs.getString("notify_type")); n.setTargetType(rs.getString("target_type"));
        n.setTargetId(rs.getInt("target_id")); n.setTargetName(rs.getString("target_name"));
        n.setSenderId(rs.getInt("sender_id")); n.setSenderName(rs.getString("sender_name"));
        n.setSendChannel(rs.getString("send_channel")); n.setIsRead(rs.getInt("is_read"));
        n.setReadTime(rs.getTimestamp("read_time")); n.setExpireTime(rs.getTimestamp("expire_time"));
        n.setCreateTime(rs.getTimestamp("create_time"));
        return n;
    }
}