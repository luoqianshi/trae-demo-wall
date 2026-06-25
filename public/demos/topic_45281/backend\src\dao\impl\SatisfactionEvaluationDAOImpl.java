package dao.impl;

import bean.SatisfactionEvaluation;
import dao.SatisfactionEvaluationDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class SatisfactionEvaluationDAOImpl implements SatisfactionEvaluationDAO {

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
}