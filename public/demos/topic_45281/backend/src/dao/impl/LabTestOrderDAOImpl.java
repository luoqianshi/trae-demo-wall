package dao.impl;
import bean.LabTestOrder;
import dao.LabTestOrderDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class LabTestOrderDAOImpl implements LabTestOrderDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            ResultSet rs = qr.getResultSet();
            while(rs.next()) list.add(mapper.apply(rs));
        } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(LabTestOrder o) { return JDBCUtil.executeInsert("INSERT INTO lab_test_order(order_no,patient_id,patient_name,medical_record_no,admission_no,doctor_id,doctor_name,dept_id,dept_name,test_type,test_items,specimen_type,specimen_status,collection_time,collector_id,collector_name,receive_time,receiver_name,urgent_flag,diagnosis,clinical_note,status,total_amount) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",o.getOrderNo(),o.getPatientId(),o.getPatientName(),o.getMedicalRecordNo(),o.getAdmissionNo(),o.getDoctorId(),o.getDoctorName(),o.getDeptId(),o.getDeptName(),o.getTestType(),o.getTestItems(),o.getSpecimenType(),o.getSpecimenStatus(),o.getCollectionTime(),o.getCollectorId(),o.getCollectorName(),o.getReceiveTime(),o.getReceiverName(),o.getUrgentFlag(),o.getDiagnosis(),o.getClinicalNote(),o.getStatus(),o.getTotalAmount()); }
    @Override public int update(LabTestOrder o) { return JDBCUtil.executeUpdate("UPDATE lab_test_order SET specimen_status=?,collection_time=?,collector_id=?,collector_name=?,receive_time=?,receiver_name=?,status=?,report_time=? WHERE id=?",o.getSpecimenStatus(),o.getCollectionTime(),o.getCollectorId(),o.getCollectorName(),o.getReceiveTime(),o.getReceiverName(),o.getStatus(),o.getReportTime(),o.getId()); }
    @Override public LabTestOrder findById(int id) { List<LabTestOrder> list = queryList("SELECT * FROM lab_test_order WHERE id=?",this::mapLTO,id); return list.isEmpty()?null:list.get(0); }
    @Override public List<LabTestOrder> findOrdersByPatientId(int patientId) { return queryList("SELECT * FROM lab_test_order WHERE patient_id=? ORDER BY create_time DESC",this::mapLTO,patientId); }
    @Override public List<LabTestOrder> findOrders(String status,int page,int size) { String sql="SELECT * FROM lab_test_order WHERE 1=1";List<Object>params=new ArrayList<>();if(status!=null&&!status.isEmpty()){sql+=" AND status=?";params.add(status);}sql+=" ORDER BY create_time DESC LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapLTO,params.toArray(new Object[0])); }
    private LabTestOrder mapLTO(ResultSet rs) { try{LabTestOrder o=new LabTestOrder(); o.setId(rs.getInt("id")); o.setOrderNo(rs.getString("order_no")); o.setPatientId(rs.getInt("patient_id")); o.setPatientName(rs.getString("patient_name")); o.setMedicalRecordNo(rs.getString("medical_record_no")); o.setAdmissionNo(rs.getString("admission_no")); o.setDoctorId(rs.getInt("doctor_id")); o.setDoctorName(rs.getString("doctor_name")); o.setDeptId(rs.getInt("dept_id")); o.setDeptName(rs.getString("dept_name")); o.setTestType(rs.getString("test_type")); o.setTestItems(rs.getString("test_items")); o.setSpecimenType(rs.getString("specimen_type")); o.setSpecimenStatus(rs.getString("specimen_status")); o.setCollectionTime(rs.getTimestamp("collection_time")); if(rs.getObject("collector_id")!=null)o.setCollectorId(rs.getInt("collector_id")); o.setCollectorName(rs.getString("collector_name")); o.setReceiveTime(rs.getTimestamp("receive_time")); o.setReceiverName(rs.getString("receiver_name")); o.setUrgentFlag(rs.getInt("urgent_flag")); o.setDiagnosis(rs.getString("diagnosis")); o.setClinicalNote(rs.getString("clinical_note")); o.setStatus(rs.getString("status")); o.setReportTime(rs.getTimestamp("report_time")); o.setTotalAmount(rs.getBigDecimal("total_amount")); o.setCreateTime(rs.getTimestamp("create_time")); o.setUpdateTime(rs.getTimestamp("update_time")); return o;}catch(SQLException e){return null;} }
}
