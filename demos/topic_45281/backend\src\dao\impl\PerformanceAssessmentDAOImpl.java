package dao.impl;
import bean.PerformanceAssessment;
import dao.PerformanceAssessmentDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class PerformanceAssessmentDAOImpl implements PerformanceAssessmentDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(PerformanceAssessment p){return JDBCUtil.executeInsert("INSERT INTO performance_assessment(assess_no,assess_period,dept_id,dept_name,staff_id,staff_name,work_quantity_score,work_quality_score,service_score,innovation_score,teamwork_score,total_score,assess_level,bonus_amount,penalty_amount,assessor_id,assessor_name,assess_date,comment,status)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",p.getAssessNo(),p.getAssessPeriod(),p.getDeptId(),p.getDeptName(),p.getStaffId(),p.getStaffName(),p.getWorkQuantityScore(),p.getWorkQualityScore(),p.getServiceScore(),p.getInnovationScore(),p.getTeamworkScore(),p.getTotalScore(),p.getAssessLevel(),p.getBonusAmount(),p.getPenaltyAmount(),p.getAssessorId(),p.getAssessorName(),p.getAssessDate(),p.getComment(),p.getStatus());}
    @Override public int update(PerformanceAssessment p){return JDBCUtil.executeUpdate("UPDATE performance_assessment SET status=?WHERE id=?",p.getStatus(),p.getId());}
    @Override public PerformanceAssessment findById(int id){List<PerformanceAssessment>l=queryList("SELECT*FROM performance_assessment WHERE id=?",this::mapPA,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<PerformanceAssessment> findByStaffId(int staffId){return queryList("SELECT*FROM performance_assessment WHERE staff_id=?ORDER BY assess_period DESC",this::mapPA,staffId);}
    @Override public List<PerformanceAssessment> findAssessments(String assessPeriod,String status,int page,int size){String sql="SELECT*FROM performance_assessment WHERE 1=1";List<Object>params=new ArrayList<>();if(assessPeriod!=null&&!assessPeriod.isEmpty()){sql+=" AND assess_period=?";params.add(assessPeriod);}if(status!=null&&!status.isEmpty()){sql+=" AND status=?";params.add(status);}sql+=" ORDER BY assess_date DESC LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapPA,params.toArray(new Object[0]));}
    private PerformanceAssessment mapPA(ResultSet rs){try{PerformanceAssessment p=new PerformanceAssessment();p.setId(rs.getInt("id"));p.setAssessNo(rs.getString("assess_no"));p.setAssessPeriod(rs.getString("assess_period"));p.setDeptId(rs.getInt("dept_id"));p.setDeptName(rs.getString("dept_name"));p.setStaffId(rs.getInt("staff_id"));p.setStaffName(rs.getString("staff_name"));p.setWorkQuantityScore(rs.getBigDecimal("work_quantity_score"));p.setWorkQualityScore(rs.getBigDecimal("work_quality_score"));p.setServiceScore(rs.getBigDecimal("service_score"));p.setInnovationScore(rs.getBigDecimal("innovation_score"));p.setTeamworkScore(rs.getBigDecimal("teamwork_score"));p.setTotalScore(rs.getBigDecimal("total_score"));p.setAssessLevel(rs.getString("assess_level"));p.setBonusAmount(rs.getBigDecimal("bonus_amount"));p.setPenaltyAmount(rs.getBigDecimal("penalty_amount"));p.setAssessorId(rs.getInt("assessor_id"));p.setAssessorName(rs.getString("assessor_name"));p.setAssessDate(rs.getDate("assess_date"));p.setComment(rs.getString("comment"));p.setStatus(rs.getString("status"));p.setCreateTime(rs.getTimestamp("create_time"));p.setUpdateTime(rs.getTimestamp("update_time"));return p;}catch(SQLException e){return null;}}
}
