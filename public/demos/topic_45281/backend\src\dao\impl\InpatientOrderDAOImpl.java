package dao.impl;

import bean.InpatientOrder;
import dao.InpatientOrderDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class InpatientOrderDAOImpl implements InpatientOrderDAO {

    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet, T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) {
                ResultSet rs = qr.getResultSet();
                while (rs.next()) {
                    T item = mapper.apply(rs);
                    if (item != null) {
                        list.add(item);
                    }
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override public int insert(InpatientOrder o) {
        return JDBCUtil.executeInsert("INSERT INTO inpatient_order(inpatient_id,patient_id,patient_name,admission_no,bed_no,order_group_no,order_type,category,order_content,drug_id,drug_name,dosage,dosage_unit,frequency,route,quantity,unit,start_time,stop_time,stop_doctor_id,stop_doctor_name,stop_reason,doctor_id,doctor_name,nurse_id,nurse_name,execute_time,status,reviewer_id,reviewer_name,review_time,priority,is_prn,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            o.getInpatientId(), o.getPatientId(), o.getPatientName(), o.getAdmissionNo(), o.getBedNo(),
            o.getOrderGroupNo(), o.getOrderType(), o.getCategory(), o.getOrderContent(),
            o.getDrugId(), o.getDrugName(), o.getDosage(), o.getDosageUnit(), o.getFrequency(),
            o.getRoute(), o.getQuantity(), o.getUnit(), o.getStartTime(), o.getStopTime(),
            o.getStopDoctorId(), o.getStopDoctorName(), o.getStopReason(), o.getDoctorId(),
            o.getDoctorName(), o.getNurseId(), o.getNurseName(), o.getExecuteTime(),
            o.getStatus() != null ? o.getStatus() : "待审核", o.getReviewerId(), o.getReviewerName(),
            o.getReviewTime(), o.getPriority() != null ? o.getPriority() : "普通", o.getIsPrn(), o.getRemark());
    }
    @Override public int update(InpatientOrder o) {
        return JDBCUtil.executeUpdate("UPDATE inpatient_order SET status=?,stop_time=?,stop_doctor_id=?,stop_doctor_name=?,stop_reason=?,nurse_id=?,nurse_name=?,execute_time=?,reviewer_id=?,reviewer_name=?,review_time=? WHERE id=?",
            o.getStatus(), o.getStopTime(), o.getStopDoctorId(), o.getStopDoctorName(), o.getStopReason(),
            o.getNurseId(), o.getNurseName(), o.getExecuteTime(), o.getReviewerId(), o.getReviewerName(),
            o.getReviewTime(), o.getId());
    }
    @Override public InpatientOrder findOrderById(int id) {
        List<InpatientOrder> list = queryList("SELECT * FROM inpatient_order WHERE id=?", this::mapIO, id);
        return list.isEmpty() ? null : list.get(0);
    }
    @Override public List<InpatientOrder> findByInpatientId(int inpatientId) {
        return queryList("SELECT * FROM inpatient_order WHERE inpatient_id=? AND status NOT IN('已停止','已作废') ORDER BY start_time DESC", this::mapIO, inpatientId);
    }
    @Override public List<InpatientOrder> findAllOrders(String type, String status, int page, int size) {
        String sql = "SELECT * FROM inpatient_order WHERE 1=1";
        List<Object> params = new ArrayList<>();
        if (type != null && !type.isEmpty()) { sql += " AND order_type=?"; params.add(type); }
        if (status != null && !status.isEmpty()) { sql += " AND status=?"; params.add(status); }
        sql += " ORDER BY start_time DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryList(sql, this::mapIO, params.toArray());
    }

    private InpatientOrder mapIO(ResultSet rs) {
        try {
            InpatientOrder o = new InpatientOrder();
            o.setId(rs.getInt("id")); o.setInpatientId(rs.getInt("inpatient_id")); o.setPatientId(rs.getInt("patient_id"));
            o.setPatientName(rs.getString("patient_name")); o.setAdmissionNo(rs.getString("admission_no"));
            o.setBedNo(rs.getString("bed_no")); o.setOrderGroupNo(rs.getString("order_group_no"));
            o.setOrderType(rs.getString("order_type")); o.setCategory(rs.getString("category"));
            o.setOrderContent(rs.getString("order_content")); o.setDrugId(rs.getObject("drug_id") != null ? rs.getInt("drug_id") : null);
            o.setDrugName(rs.getString("drug_name")); o.setDosage(rs.getString("dosage"));
            o.setDosageUnit(rs.getString("dosage_unit")); o.setFrequency(rs.getString("frequency"));
            o.setRoute(rs.getString("route")); o.setQuantity(rs.getObject("quantity") != null ? rs.getInt("quantity") : null);
            o.setUnit(rs.getString("unit")); o.setStartTime(rs.getTimestamp("start_time"));
            o.setStopTime(rs.getTimestamp("stop_time")); o.setStopDoctorId(rs.getObject("stop_doctor_id") != null ? rs.getInt("stop_doctor_id") : null);
            o.setStopDoctorName(rs.getString("stop_doctor_name")); o.setStopReason(rs.getString("stop_reason"));
            o.setDoctorId(rs.getInt("doctor_id")); o.setDoctorName(rs.getString("doctor_name"));
            o.setNurseId(rs.getObject("nurse_id") != null ? rs.getInt("nurse_id") : null);
            o.setNurseName(rs.getString("nurse_name")); o.setExecuteTime(rs.getTimestamp("execute_time"));
            o.setStatus(rs.getString("status")); o.setReviewerId(rs.getObject("reviewer_id") != null ? rs.getInt("reviewer_id") : null);
            o.setReviewerName(rs.getString("reviewer_name")); o.setReviewTime(rs.getTimestamp("review_time"));
            o.setPriority(rs.getString("priority")); o.setIsPrn(rs.getInt("is_prn"));
            o.setRemark(rs.getString("remark"));
            o.setCreateTime(rs.getTimestamp("create_time")); o.setUpdateTime(rs.getTimestamp("update_time"));
            return o;
        } catch (SQLException e) { return null; }
    }
}