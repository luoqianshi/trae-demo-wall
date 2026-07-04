package dao.impl;
import bean.FinanceCharge;
import dao.FinanceChargeDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class FinanceChargeDAOImpl implements FinanceChargeDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(FinanceCharge f){return JDBCUtil.executeInsert("INSERT INTO finance_charge(charge_no,patient_id,patient_name,medical_record_no,admission_no,charge_type,total_amount,self_pay_amount,insurance_amount,discount_amount,actual_amount,payment_method,charge_items,charge_dept_id,charge_dept_name,charger_id,charger_name,status)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",f.getChargeNo(),f.getPatientId(),f.getPatientName(),f.getMedicalRecordNo(),f.getAdmissionNo(),f.getChargeType(),f.getTotalAmount(),f.getSelfPayAmount(),f.getInsuranceAmount(),f.getDiscountAmount(),f.getActualAmount(),f.getPaymentMethod(),f.getChargeItems(),f.getChargeDeptId(),f.getChargeDeptName(),f.getChargerId(),f.getChargerName(),f.getStatus());}
    @Override public int update(FinanceCharge f){return JDBCUtil.executeUpdate("UPDATE finance_charge SET refund_flag=?,refund_amount=?,refund_time=?,status=?WHERE id=?",f.getRefundFlag(),f.getRefundAmount(),f.getRefundTime(),f.getStatus(),f.getId());}
    @Override public FinanceCharge findById(int id){List<FinanceCharge>l=queryList("SELECT*FROM finance_charge WHERE id=?",this::mapFC,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<FinanceCharge> findByPatientId(int patientId){return queryList("SELECT*FROM finance_charge WHERE patient_id=?ORDER BY charge_time DESC",this::mapFC,patientId);}
    @Override public List<FinanceCharge> findCharges(String chargeType,String status,int page,int size){String sql="SELECT*FROM finance_charge WHERE 1=1";List<Object>params=new ArrayList<>();if(chargeType!=null&&!chargeType.isEmpty()){sql+=" AND charge_type=?";params.add(chargeType);}if(status!=null&&!status.isEmpty()){sql+=" AND status=?";params.add(status);}sql+=" ORDER BY charge_time DESC LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapFC,params.toArray(new Object[0]));}
    private FinanceCharge mapFC(ResultSet rs){try{FinanceCharge f=new FinanceCharge();f.setId(rs.getInt("id"));f.setChargeNo(rs.getString("charge_no"));f.setPatientId(rs.getInt("patient_id"));f.setPatientName(rs.getString("patient_name"));f.setMedicalRecordNo(rs.getString("medical_record_no"));f.setAdmissionNo(rs.getString("admission_no"));f.setChargeType(rs.getString("charge_type"));f.setTotalAmount(rs.getBigDecimal("total_amount"));f.setSelfPayAmount(rs.getBigDecimal("self_pay_amount"));f.setInsuranceAmount(rs.getBigDecimal("insurance_amount"));f.setDiscountAmount(rs.getBigDecimal("discount_amount"));f.setActualAmount(rs.getBigDecimal("actual_amount"));f.setPaymentMethod(rs.getString("payment_method"));f.setChargeItems(rs.getString("charge_items"));if(rs.getObject("charge_dept_id")!=null)f.setChargeDeptId(rs.getInt("charge_dept_id"));f.setChargeDeptName(rs.getString("charge_dept_name"));f.setChargerId(rs.getInt("charger_id"));f.setChargerName(rs.getString("charger_name"));f.setChargeTime(rs.getTimestamp("charge_time"));f.setRefundFlag(rs.getInt("refund_flag"));f.setRefundAmount(rs.getBigDecimal("refund_amount"));f.setRefundTime(rs.getTimestamp("refund_time"));f.setStatus(rs.getString("status"));f.setCreateTime(rs.getTimestamp("create_time"));f.setUpdateTime(rs.getTimestamp("update_time"));return f;}catch(SQLException e){return null;}}
}
