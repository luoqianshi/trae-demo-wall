package dao.impl;

import bean.ConsultationMessage;
import dao.ConsultationMessageDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class ConsultationMessageDAOImpl implements ConsultationMessageDAO {

    @Override public int insert(ConsultationMessage m) {
        int ret = JDBCUtil.executeInsert("INSERT INTO consultation_message(consultation_id,sender_id,sender_role,sender_name,message_type,content) VALUES(?,?,?,?,?,?)",
            m.getConsultationId(), m.getSenderId(), m.getSenderRole(), m.getSenderName(), m.getMessageType(), m.getContent());
        JDBCUtil.executeUpdate("UPDATE consultation SET last_message_time=NOW(),status='咨询中' WHERE id=?", m.getConsultationId());
        return ret;
    }
    @Override public List<ConsultationMessage> findByConsultationId(int consultationId) {
        List<ConsultationMessage> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM consultation_message WHERE consultation_id=? ORDER BY create_time ASC", consultationId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapMessage(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public int markReadByConsultation(int consultationId, int userId) {
        return JDBCUtil.executeUpdate("UPDATE consultation_message SET is_read=1 WHERE consultation_id=? AND sender_id!=?", consultationId, userId);
    }

    private ConsultationMessage mapMessage(ResultSet rs) throws SQLException {
        ConsultationMessage m = new ConsultationMessage();
        m.setId(rs.getInt("id")); m.setConsultationId(rs.getInt("consultation_id"));
        m.setSenderId(rs.getInt("sender_id")); m.setSenderRole(rs.getString("sender_role"));
        m.setSenderName(rs.getString("sender_name")); m.setMessageType(rs.getString("message_type"));
        m.setContent(rs.getString("content")); m.setIsRead(rs.getInt("is_read"));
        m.setCreateTime(rs.getTimestamp("create_time"));
        return m;
    }
}