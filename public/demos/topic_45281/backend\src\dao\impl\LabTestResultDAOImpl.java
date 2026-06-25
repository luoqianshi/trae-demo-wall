package dao.impl;
import bean.LabTestResult;
import dao.LabTestResultDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class LabTestResultDAOImpl implements LabTestResultDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(LabTestResult r) { return JDBCUtil.executeInsert("INSERT INTO lab_test_result(order_id,order_no,item_code,item_name,result_value,result_text,unit,reference_range,abnormal_flag,abnormal_mark,method,instrument,reagent_lot,tester_id,tester_name,reviewer_id,reviewer_name,review_time,quality_control,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",r.getOrderId(),r.getOrderNo(),r.getItemCode(),r.getItemName(),r.getResultValue(),r.getResultText(),r.getUnit(),r.getReferenceRange(),r.getAbnormalFlag(),r.getAbnormalMark(),r.getMethod(),r.getInstrument(),r.getReagentLot(),r.getTesterId(),r.getTesterName(),r.getReviewerId(),r.getReviewerName(),r.getReviewTime(),r.getQualityControl(),r.getRemark()); }
    @Override public int update(LabTestResult r) { return JDBCUtil.executeUpdate("UPDATE lab_test_result SET result_value=?,result_text=?,abnormal_flag=?,abnormal_mark=?,reviewer_id=?,reviewer_name=?,review_time=?,quality_control=? WHERE id=?",r.getResultValue(),r.getResultText(),r.getAbnormalFlag(),r.getAbnormalMark(),r.getReviewerId(),r.getReviewerName(),r.getReviewTime(),r.getQualityControl(),r.getId()); }
    @Override public LabTestResult findById(int id){List<LabTestResult> l=queryList("SELECT*FROM lab_test_result WHERE id=?",this::mapLTR,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<LabTestResult> findByOrderId(int orderId){return queryList("SELECT*FROM lab_test_result WHERE order_id=? ORDER BY item_code",this::mapLTR,orderId);}
    private LabTestResult mapLTR(ResultSet rs){try{LabTestResult r=new LabTestResult();r.setId(rs.getInt("id"));r.setOrderId(rs.getInt("order_id"));r.setOrderNo(rs.getString("order_no"));r.setItemCode(rs.getString("item_code"));r.setItemName(rs.getString("item_name"));r.setResultValue(rs.getString("result_value"));r.setResultText(rs.getString("result_text"));r.setUnit(rs.getString("unit"));r.setReferenceRange(rs.getString("reference_range"));r.setAbnormalFlag(rs.getInt("abnormal_flag"));r.setAbnormalMark(rs.getString("abnormal_mark"));r.setMethod(rs.getString("method"));r.setInstrument(rs.getString("instrument"));r.setReagentLot(rs.getString("reagent_lot"));if(rs.getObject("tester_id")!=null)r.setTesterId(rs.getInt("tester_id"));r.setTesterName(rs.getString("tester_name"));if(rs.getObject("reviewer_id")!=null)r.setReviewerId(rs.getInt("reviewer_id"));r.setReviewerName(rs.getString("reviewer_name"));r.setReviewTime(rs.getTimestamp("review_time"));r.setQualityControl(rs.getString("quality_control"));r.setRemark(rs.getString("remark"));r.setCreateTime(rs.getTimestamp("create_time"));return r;}catch(SQLException e){return null;}}
}
