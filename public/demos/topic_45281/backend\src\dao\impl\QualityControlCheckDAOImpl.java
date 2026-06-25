package dao.impl;
import bean.QualityControlCheck;
import dao.QualityControlCheckDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class QualityControlCheckDAOImpl implements QualityControlCheckDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(QualityControlCheck c){return JDBCUtil.executeInsert("INSERT INTO quality_control_check(check_no,check_type,dept_id,dept_name,patient_id,patient_name,medical_record_no,admission_no,checker_id,checker_name,check_date,check_items,score,total_score,pass_flag,problem_desc,improve_require,improve_deadline,status)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",c.getCheckNo(),c.getCheckType(),c.getDeptId(),c.getDeptName(),c.getPatientId(),c.getPatientName(),c.getMedicalRecordNo(),c.getAdmissionNo(),c.getCheckerId(),c.getCheckerName(),c.getCheckDate(),c.getCheckItems(),c.getScore(),c.getTotalScore(),c.getPassFlag(),c.getProblemDesc(),c.getImproveRequire(),c.getImproveDeadline(),c.getStatus());}
    @Override public int update(QualityControlCheck c){return JDBCUtil.executeUpdate("UPDATE quality_control_check SET score=?,total_score=?,pass_flag=?,problem_desc=?,improve_require=?,improve_deadline=?,status=?WHERE id=?",c.getScore(),c.getTotalScore(),c.getPassFlag(),c.getProblemDesc(),c.getImproveRequire(),c.getImproveDeadline(),c.getStatus(),c.getId());}
    @Override public QualityControlCheck findById(int id){List<QualityControlCheck>l=queryList("SELECT*FROM quality_control_check WHERE id=?",this::mapQCC,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<QualityControlCheck> findByDeptId(int deptId){return queryList("SELECT*FROM quality_control_check WHERE dept_id=?ORDER BY check_date DESC",this::mapQCC,deptId);}
    @Override public List<QualityControlCheck> findChecks(String checkType,String status,int page,int size){String sql="SELECT*FROM quality_control_check WHERE 1=1";List<Object>params=new ArrayList<>();if(checkType!=null&&!checkType.isEmpty()){sql+=" AND check_type=?";params.add(checkType);}if(status!=null&&!status.isEmpty()){sql+=" AND status=?";params.add(status);}sql+=" ORDER BY check_time DESC LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapQCC,params.toArray(new Object[0]));}
    private QualityControlCheck mapQCC(ResultSet rs){try{QualityControlCheck c=new QualityControlCheck();c.setId(rs.getInt("id"));c.setCheckNo(rs.getString("check_no"));c.setCheckType(rs.getString("check_type"));c.setDeptId(rs.getInt("dept_id"));c.setDeptName(rs.getString("dept_name"));c.setPatientId(rs.getInt("patient_id"));c.setPatientName(rs.getString("patient_name"));c.setMedicalRecordNo(rs.getString("medical_record_no"));c.setAdmissionNo(rs.getString("admission_no"));c.setCheckerId(rs.getInt("checker_id"));c.setCheckerName(rs.getString("checker_name"));c.setCheckDate(rs.getDate("check_date"));c.setCheckItems(rs.getString("check_items"));c.setScore(rs.getBigDecimal("score"));c.setTotalScore(rs.getBigDecimal("total_score"));c.setPassFlag(rs.getInt("pass_flag"));c.setProblemDesc(rs.getString("problem_desc"));c.setImproveRequire(rs.getString("improve_require"));c.setImproveDeadline(rs.getDate("improve_deadline"));c.setStatus(rs.getString("status"));c.setCreateTime(rs.getTimestamp("create_time"));c.setUpdateTime(rs.getTimestamp("update_time"));return c;}catch(SQLException e){return null;}}
}
