package dao.impl;
import bean.ImagingReport;
import dao.ImagingReportDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class ImagingReportDAOImpl implements ImagingReportDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(ImagingReport r){return JDBCUtil.executeInsert("INSERT INTO imaging_report(exam_id,exam_no,findings,impression,recommendation,report_type,radiologist_id,radiologist_name,report_time,reviewer_id,reviewer_name,review_time,status)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",r.getExamId(),r.getExamNo(),r.getFindings(),r.getImpression(),r.getRecommendation(),r.getReportType(),r.getRadiologistId(),r.getRadiologistName(),r.getReportTime(),r.getReviewerId(),r.getReviewerName(),r.getReviewTime(),r.getStatus());}
    @Override public int update(ImagingReport r){return JDBCUtil.executeUpdate("UPDATE imaging_report SET findings=?,impression=?,recommendation=?,reviewer_id=?,reviewer_name=?,review_time=?,status=?WHERE id=?",r.getFindings(),r.getImpression(),r.getRecommendation(),r.getReviewerId(),r.getReviewerName(),r.getReviewTime(),r.getStatus(),r.getId());}
    @Override public ImagingReport findById(int id){List<ImagingReport>l=queryList("SELECT*FROM imaging_report WHERE id=?",this::mapIR,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<ImagingReport> findByExamId(int examId){return queryList("SELECT*FROM imaging_report WHERE exam_id=?ORDER BY report_time DESC",this::mapIR,examId);}
    private ImagingReport mapIR(ResultSet rs){try{ImagingReport r=new ImagingReport();r.setId(rs.getInt("id"));r.setExamId(rs.getInt("exam_id"));r.setExamNo(rs.getString("exam_no"));r.setFindings(rs.getString("findings"));r.setImpression(rs.getString("impression"));r.setRecommendation(rs.getString("recommendation"));r.setReportType(rs.getString("report_type"));r.setRadiologistId(rs.getInt("radiologist_id"));r.setRadiologistName(rs.getString("radiologist_name"));r.setReportTime(rs.getTimestamp("report_time"));if(rs.getObject("reviewer_id")!=null)r.setReviewerId(rs.getInt("reviewer_id"));r.setReviewerName(rs.getString("reviewer_name"));r.setReviewTime(rs.getTimestamp("review_time"));r.setStatus(rs.getString("status"));r.setCreateTime(rs.getTimestamp("create_time"));r.setUpdateTime(rs.getTimestamp("update_time"));return r;}catch(SQLException e){return null;}}
}
