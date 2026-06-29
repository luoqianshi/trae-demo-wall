package dao.impl;
import bean.ClinicalPathwayInstance;
import dao.ClinicalPathwayInstanceDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class ClinicalPathwayInstanceDAOImpl implements ClinicalPathwayInstanceDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(ClinicalPathwayInstance i){return JDBCUtil.executeInsert("INSERT INTO clinical_pathway_instance(pathway_id,pathway_name,inpatient_id,patient_id,patient_name,admission_no,doctor_id,doctor_name,dept_id,dept_name,entry_date,expected_exit_date)VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",i.getPathwayId(),i.getPathwayName(),i.getInpatientId(),i.getPatientId(),i.getPatientName(),i.getAdmissionNo(),i.getDoctorId(),i.getDoctorName(),i.getDeptId(),i.getDeptName(),i.getEntryDate(),i.getExpectedExitDate());}
    @Override public int update(ClinicalPathwayInstance i){return JDBCUtil.executeUpdate("UPDATE clinical_pathway_instance SET current_day=?,total_days=?,actual_exit_date=?,exit_reason=?,variation_record=?,variation_type=?,completion_rate=?,status=?WHERE id=?",i.getCurrentDay(),i.getTotalDays(),i.getActualExitDate(),i.getExitReason(),i.getVariationRecord(),i.getVariationType(),i.getCompletionRate(),i.getStatus(),i.getId());}
    @Override public ClinicalPathwayInstance findById(int id){List<ClinicalPathwayInstance>l=queryList("SELECT*FROM clinical_pathway_instance WHERE id=?",this::mapCPI,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<ClinicalPathwayInstance> findInstancesByInpatientId(int inpatientId){return queryList("SELECT*FROM clinical_pathway_instance WHERE inpatient_id=?ORDER BY entry_date DESC",this::mapCPI,inpatientId);}
    @Override public List<ClinicalPathwayInstance> findInstances(String status,int page,int size){String sql="SELECT*FROM clinical_pathway_instance WHERE 1=1";List<Object>params=new ArrayList<>();if(status!=null&&!status.isEmpty()){sql+=" AND status=?";params.add(status);}sql+=" ORDER BY create_time DESC LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapCPI,params.toArray(new Object[0]));}
    private ClinicalPathwayInstance mapCPI(ResultSet rs){try{ClinicalPathwayInstance i=new ClinicalPathwayInstance();i.setId(rs.getInt("id"));i.setPathwayId(rs.getInt("pathway_id"));i.setPathwayName(rs.getString("pathway_name"));i.setInpatientId(rs.getInt("inpatient_id"));i.setPatientId(rs.getInt("patient_id"));i.setPatientName(rs.getString("patient_name"));i.setAdmissionNo(rs.getString("admission_no"));i.setDoctorId(rs.getInt("doctor_id"));i.setDoctorName(rs.getString("doctor_name"));i.setDeptId(rs.getInt("dept_id"));i.setDeptName(rs.getString("dept_name"));i.setEntryDate(rs.getDate("entry_date"));i.setExpectedExitDate(rs.getDate("expected_exit_date"));i.setActualExitDate(rs.getDate("actual_exit_date"));i.setCurrentDay(rs.getInt("current_day"));if(rs.getObject("total_days")!=null)i.setTotalDays(rs.getInt("total_days"));i.setExitReason(rs.getString("exit_reason"));i.setVariationRecord(rs.getString("variation_record"));i.setVariationType(rs.getString("variation_type"));if(rs.getObject("completion_rate")!=null)i.setCompletionRate(rs.getBigDecimal("completion_rate"));i.setStatus(rs.getString("status"));i.setCreateTime(rs.getTimestamp("create_time"));i.setUpdateTime(rs.getTimestamp("update_time"));return i;}catch(SQLException e){return null;}}
}
