package dao.impl;

import bean.*;
import dao.*;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class HuiminDAOImpl implements
    QueueTicketDAO, PaymentRecordDAO, SatisfactionEvaluationDAO,
    NotificationDAO, CompanionServiceDAO, PatientLocationDAO,
    PublicInfoDAO, ConsultationDAO, ConsultationMessageDAO {

    private List<QueueTicket> queryTickets(String sql, Object... params) {
        List<QueueTicket> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapQueueTicket(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override public int insert(QueueTicket t) {
        return JDBCUtil.executeInsert("INSERT INTO queue_ticket(business_type,patient_id,patient_name,ticket_no,dept_id,dept_name,window_no,status,priority) VALUES(?,?,?,?,?,?,?,?,?)",
            t.getBusinessType(), t.getPatientId(), t.getPatientName(), t.getTicketNo(), t.getDeptId(), t.getDeptName(), t.getWindowNo(),
            t.getStatus() != null ? t.getStatus() : "等待中", t.getPriority());
    }
    @Override public int update(QueueTicket t) {
        return JDBCUtil.executeUpdate("UPDATE queue_ticket SET status=?,window_no=?,called_count=?,start_time=?,finish_time=? WHERE id=?",
            t.getStatus(), t.getWindowNo(), t.getCalledCount(), t.getStartTime(), t.getFinishTime(), t.getId());
    }
    @Override public List<QueueTicket> findByTypeAndStatus(String type, String status) {
        String sql = "SELECT * FROM queue_ticket WHERE business_type=?";
        List<Object> params = new ArrayList<>();
        params.add(type);
        if (status != null && !status.isEmpty()) { sql += " AND status=?"; params.add(status); }
        sql += " ORDER BY priority DESC, create_time ASC";
        return queryTickets(sql, params.toArray());
    }
    @Override public QueueTicket findCurrentCalling(String type, int deptId) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(
            "SELECT * FROM queue_ticket WHERE business_type=? AND dept_id=? AND status IN('叫号中','办理中') ORDER BY create_time ASC LIMIT 1", type, deptId)) {
            if (qr != null && qr.getResultSet().next()) { return mapQueueTicket(qr.getResultSet()); }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    private List<PaymentRecord> queryPayments(String sql, Object... params) {
        List<PaymentRecord> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapPaymentRecord(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override public int insert(PaymentRecord r) {
        return JDBCUtil.executeInsert("INSERT INTO payment_record(order_no,patient_id,patient_name,business_type,business_id,amount,paid_amount,discount_amount,insurance_amount,self_pay_amount,payment_method,payment_status,payer_name,cashier_id,cashier_name,transaction_no) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            r.getOrderNo(), r.getPatientId(), r.getPatientName(), r.getBusinessType(), r.getBusinessId(),
            r.getAmount(), r.getPaidAmount(), r.getDiscountAmount(), r.getInsuranceAmount(), r.getSelfPayAmount(),
            r.getPaymentMethod(), r.getPaymentStatus() != null ? r.getPaymentStatus() : "待支付",
            r.getPayerName(), r.getCashierId(), r.getCashierName(), r.getTransactionNo());
    }
    @Override public PaymentRecord findByOrderNo(String orderNo) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM payment_record WHERE order_no=?", orderNo)) {
            if (qr != null && qr.getResultSet().next()) { return mapPaymentRecord(qr.getResultSet()); }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }
    @Override public List<PaymentRecord> findPaymentsByPatientId(int patientId) { return queryPayments("SELECT * FROM payment_record WHERE patient_id=? ORDER BY create_time DESC", patientId); }
    @Override public List<PaymentRecord> findAllPayments(int page, int size) { return queryPayments("SELECT * FROM payment_record ORDER BY create_time DESC LIMIT ? OFFSET ?", size, (page-1)*size); }
    @Override public int updateStatus(String orderNo, String status) {
        return JDBCUtil.executeUpdate("UPDATE payment_record SET payment_status=?,pay_time=NOW() WHERE order_no=?", status, orderNo);
    }

    private List<SatisfactionEvaluation> queryEvals(String sql, Object... params) {
        List<SatisfactionEvaluation> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapEvaluation(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override public int insert(SatisfactionEvaluation e) {
        return JDBCUtil.executeInsert("INSERT INTO satisfaction_evaluation(patient_id,patient_name,evaluate_type,target_id,target_name,dept_id,dept_name,overall_score,attitude_score,skill_score,efficiency_score,environment_score,comment_text,is_anonymous) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            e.getPatientId(), e.getPatientName(), e.getEvaluateType(), e.getTargetId(), e.getTargetName(),
            e.getDeptId(), e.getDeptName(), e.getOverallScore(), e.getAttitudeScore(), e.getSkillScore(),
            e.getEfficiencyScore(), e.getEnvironmentScore(), e.getCommentText(), e.getIsAnonymous());
    }
    @Override public List<SatisfactionEvaluation> findAll(String type, int page, int size) {
        String sql = "SELECT * FROM satisfaction_evaluation";
        List<Object> params = new ArrayList<>();
        if (type != null && !type.isEmpty()) { sql += " WHERE evaluate_type=?"; params.add(type); }
        sql += " ORDER BY create_time DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryEvals(sql, params.toArray());
    }
    @Override public int reply(int id, String replyText, String replyBy) {
        return JDBCUtil.executeUpdate("UPDATE satisfaction_evaluation SET reply_text=?,reply_by=?,reply_time=NOW() WHERE id=?", replyText, replyBy, id);
    }

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

    @Override public int insert(CompanionService c) {
        return JDBCUtil.executeInsert("INSERT INTO companion_service(inpatient_id,patient_id,patient_name,companion_name,companion_phone,companion_id_card,relation,start_date,end_date,status,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            c.getInpatientId(), c.getPatientId(), c.getPatientName(), c.getCompanionName(), c.getCompanionPhone(),
            c.getCompanionIdCard(), c.getRelation(), c.getStartDate(), c.getEndDate(),
            c.getStatus() != null ? c.getStatus() : "进行中", c.getRemark());
    }
    @Override public List<CompanionService> findByCompanionPatientId(int patientId) {
        List<CompanionService> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM companion_service WHERE patient_id=? ORDER BY start_date DESC", patientId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapCompanion(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public List<CompanionService> findByInpatientId(int inpatientId) {
        List<CompanionService> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM companion_service WHERE inpatient_id=? AND status='进行中'", inpatientId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapCompanion(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public int endService(int id) { return JDBCUtil.executeUpdate("UPDATE companion_service SET status='已结束',end_date=CURDATE() WHERE id=?", id); }

    @Override public int insert(PatientLocation l) {
        return JDBCUtil.executeInsert("INSERT INTO patient_location(patient_id,patient_name,location_type,area_name,room_no,floor,building,status) VALUES(?,?,?,?,?,?,?,?)",
            l.getPatientId(), l.getPatientName(), l.getLocationType(), l.getAreaName(), l.getRoomNo(), l.getFloor(), l.getBuilding(),
            l.getStatus() != null ? l.getStatus() : "在位");
    }
    @Override public List<PatientLocation> findByLocPatientId(int patientId) {
        List<PatientLocation> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM patient_location WHERE patient_id=? ORDER BY check_in_time DESC LIMIT 20", patientId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapLocation(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public int checkOut(int id) { return JDBCUtil.executeUpdate("UPDATE patient_location SET status='已离开',check_out_time=NOW() WHERE id=?", id); }

    @Override public int insert(PublicInfo p) {
        return JDBCUtil.executeInsert("INSERT INTO public_info(title,category,content,summary,cover_image,author,is_top,is_published,publish_time) VALUES(?,?,?,?,?,?,?,?,?)",
            p.getTitle(), p.getCategory(), p.getContent(), p.getSummary(), p.getCoverImage(), p.getAuthor(), p.getIsTop(), p.getIsPublished(), p.getPublishTime());
    }
    @Override public PublicInfo findById(int id) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM public_info WHERE id=?", id)) {
            if (qr != null && qr.getResultSet().next()) { return mapPublicInfo(qr.getResultSet()); }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }
    @Override public List<PublicInfo> findByCategory(String category, int page, int size) {
        String sql = "SELECT * FROM public_info WHERE is_published=1";
        List<Object> params = new ArrayList<>();
        if (category != null && !category.isEmpty()) { sql += " AND category=?"; params.add(category); }
        sql += " ORDER BY is_top DESC, publish_time DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        List<PublicInfo> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params.toArray())) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapPublicInfo(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public int incrementView(int id) { return JDBCUtil.executeUpdate("UPDATE public_info SET view_count=view_count+1 WHERE id=?", id); }
    @Override public int update(PublicInfo p) { return JDBCUtil.executeUpdate("UPDATE public_info SET title=?,category=?,content=?,summary=?,is_published=?,publish_time=? WHERE id=?", p.getTitle(), p.getCategory(), p.getContent(), p.getSummary(), p.getIsPublished(), p.getPublishTime(), p.getId()); }
    @Override public int delete(int id) { return JDBCUtil.executeUpdate("DELETE FROM public_info WHERE id=?", id); }

    @Override public int insert(Consultation c) {
        return JDBCUtil.executeInsert("INSERT INTO consultation(patient_id,patient_name,doctor_id,doctor_name,dept_name,subject,status) VALUES(?,?,?,?,?,?,?)",
            c.getPatientId(), c.getPatientName(), c.getDoctorId(), c.getDoctorName(), c.getDeptName(), c.getSubject(),
            c.getStatus() != null ? c.getStatus() : "待回复");
    }
    @Override public Consultation findConsultById(int id) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM consultation WHERE id=?", id)) {
            if (qr != null && qr.getResultSet().next()) { return mapConsultation(qr.getResultSet()); }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }
    @Override public List<Consultation> findByConsultDoctorId(int doctorId) {
        List<Consultation> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM consultation WHERE doctor_id=? ORDER BY last_message_time DESC", doctorId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapConsultation(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public List<Consultation> findByConsultPatientId(int patientId) {
        List<Consultation> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM consultation WHERE patient_id=? ORDER BY last_message_time DESC", patientId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapConsultation(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public int updateStatus(int id, String status) {
        if ("已关闭".equals(status)) return JDBCUtil.executeUpdate("UPDATE consultation SET status='已关闭',close_time=NOW() WHERE id=?", id);
        return JDBCUtil.executeUpdate("UPDATE consultation SET status=? WHERE id=?", status, id);
    }

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

    private QueueTicket mapQueueTicket(ResultSet rs) throws SQLException {
        QueueTicket t = new QueueTicket();
        t.setId(rs.getInt("id")); t.setBusinessType(rs.getString("business_type")); t.setPatientId(rs.getInt("patient_id"));
        t.setPatientName(rs.getString("patient_name")); t.setTicketNo(rs.getString("ticket_no"));
        t.setDeptId(rs.getInt("dept_id")); t.setDeptName(rs.getString("dept_name"));
        t.setWindowNo(rs.getString("window_no")); t.setStatus(rs.getString("status"));
        t.setPriority(rs.getInt("priority")); t.setCalledCount(rs.getInt("called_count"));
        t.setCallTime(rs.getTimestamp("call_time")); t.setStartTime(rs.getTimestamp("start_time"));
        t.setFinishTime(rs.getTimestamp("finish_time")); t.setWaitMinutes(rs.getObject("wait_minutes") != null ? rs.getInt("wait_minutes") : null);
        t.setCreateTime(rs.getTimestamp("create_time"));
        return t;
    }
    private PaymentRecord mapPaymentRecord(ResultSet rs) throws SQLException {
        PaymentRecord r = new PaymentRecord();
        r.setId(rs.getInt("id")); r.setOrderNo(rs.getString("order_no")); r.setPatientId(rs.getInt("patient_id"));
        r.setPatientName(rs.getString("patient_name")); r.setBusinessType(rs.getString("business_type"));
        r.setBusinessId(rs.getInt("business_id")); r.setAmount(rs.getBigDecimal("amount"));
        r.setPaidAmount(rs.getBigDecimal("paid_amount")); r.setDiscountAmount(rs.getBigDecimal("discount_amount"));
        r.setInsuranceAmount(rs.getBigDecimal("insurance_amount")); r.setSelfPayAmount(rs.getBigDecimal("self_pay_amount"));
        r.setPaymentMethod(rs.getString("payment_method")); r.setPaymentStatus(rs.getString("payment_status"));
        r.setPayerName(rs.getString("payer_name")); r.setCashierId(rs.getInt("cashier_id"));
        r.setCashierName(rs.getString("cashier_name")); r.setTransactionNo(rs.getString("transaction_no"));
        r.setRefundOrderNo(rs.getString("refund_order_no")); r.setRefundReason(rs.getString("refund_reason"));
        r.setPayTime(rs.getTimestamp("pay_time")); r.setCreateTime(rs.getTimestamp("create_time"));
        r.setUpdateTime(rs.getTimestamp("update_time"));
        return r;
    }
    private SatisfactionEvaluation mapEvaluation(ResultSet rs) throws SQLException {
        SatisfactionEvaluation e = new SatisfactionEvaluation();
        e.setId(rs.getInt("id")); e.setPatientId(rs.getInt("patient_id")); e.setPatientName(rs.getString("patient_name"));
        e.setEvaluateType(rs.getString("evaluate_type")); e.setTargetId(rs.getInt("target_id"));
        e.setTargetName(rs.getString("target_name")); e.setDeptId(rs.getInt("dept_id"));
        e.setDeptName(rs.getString("dept_name")); e.setOverallScore(rs.getInt("overall_score"));
        e.setAttitudeScore(rs.getObject("attitude_score") != null ? rs.getInt("attitude_score") : null);
        e.setSkillScore(rs.getObject("skill_score") != null ? rs.getInt("skill_score") : null);
        e.setEfficiencyScore(rs.getObject("efficiency_score") != null ? rs.getInt("efficiency_score") : null);
        e.setEnvironmentScore(rs.getObject("environment_score") != null ? rs.getInt("environment_score") : null);
        e.setCommentText(rs.getString("comment_text")); e.setIsAnonymous(rs.getInt("is_anonymous"));
        e.setReplyText(rs.getString("reply_text")); e.setReplyBy(rs.getString("reply_by"));
        e.setReplyTime(rs.getTimestamp("reply_time")); e.setCreateTime(rs.getTimestamp("create_time"));
        return e;
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
    private CompanionService mapCompanion(ResultSet rs) throws SQLException {
        CompanionService c = new CompanionService();
        c.setId(rs.getInt("id")); c.setInpatientId(rs.getObject("inpatient_id") != null ? rs.getInt("inpatient_id") : null);
        c.setPatientId(rs.getInt("patient_id")); c.setPatientName(rs.getString("patient_name"));
        c.setCompanionName(rs.getString("companion_name")); c.setCompanionPhone(rs.getString("companion_phone"));
        c.setCompanionIdCard(rs.getString("companion_id_card")); c.setRelation(rs.getString("relation"));
        c.setStartDate(rs.getDate("start_date")); c.setEndDate(rs.getDate("end_date"));
        c.setStatus(rs.getString("status")); c.setRemark(rs.getString("remark"));
        c.setCreateTime(rs.getTimestamp("create_time"));
        return c;
    }
    private PatientLocation mapLocation(ResultSet rs) throws SQLException {
        PatientLocation l = new PatientLocation();
        l.setId(rs.getInt("id")); l.setPatientId(rs.getInt("patient_id")); l.setPatientName(rs.getString("patient_name"));
        l.setLocationType(rs.getString("location_type")); l.setAreaName(rs.getString("area_name"));
        l.setRoomNo(rs.getString("room_no")); l.setFloor(rs.getString("floor"));
        l.setBuilding(rs.getString("building")); l.setCheckInTime(rs.getTimestamp("check_in_time"));
        l.setCheckOutTime(rs.getTimestamp("check_out_time")); l.setStatus(rs.getString("status"));
        l.setRemark(rs.getString("remark")); l.setCreateTime(rs.getTimestamp("create_time"));
        return l;
    }
    private PublicInfo mapPublicInfo(ResultSet rs) throws SQLException {
        PublicInfo p = new PublicInfo();
        p.setId(rs.getInt("id")); p.setTitle(rs.getString("title")); p.setCategory(rs.getString("category"));
        p.setContent(rs.getString("content")); p.setSummary(rs.getString("summary"));
        p.setCoverImage(rs.getString("cover_image")); p.setAuthor(rs.getString("author"));
        p.setViewCount(rs.getInt("view_count")); p.setIsTop(rs.getInt("is_top"));
        p.setIsPublished(rs.getInt("is_published")); p.setPublishTime(rs.getTimestamp("publish_time"));
        p.setCreateTime(rs.getTimestamp("create_time")); p.setUpdateTime(rs.getTimestamp("update_time"));
        return p;
    }
    private Consultation mapConsultation(ResultSet rs) throws SQLException {
        Consultation c = new Consultation();
        c.setId(rs.getInt("id")); c.setPatientId(rs.getInt("patient_id")); c.setPatientName(rs.getString("patient_name"));
        c.setDoctorId(rs.getInt("doctor_id")); c.setDoctorName(rs.getString("doctor_name"));
        c.setDeptName(rs.getString("dept_name")); c.setSubject(rs.getString("subject"));
        c.setStatus(rs.getString("status")); c.setLastMessageTime(rs.getTimestamp("last_message_time"));
        c.setCloseTime(rs.getTimestamp("close_time")); c.setCreateTime(rs.getTimestamp("create_time"));
        return c;
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

