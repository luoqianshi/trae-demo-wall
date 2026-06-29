package dao.impl;

import bean.PhysicalExam;
import dao.PhysicalExamDAO;
import util.JDBCUtil;
import java.util.ArrayList;
import java.util.List;

public class PhysicalExamDAOImpl implements PhysicalExamDAO {
    @Override
    public int insert(PhysicalExam exam) {
        String sql = "INSERT INTO physical_exam(patient_id, exam_date, status, conclusion, examiner, items, total_fee, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, exam.getPatientId(), exam.getExamDate(), exam.getStatus(), exam.getConclusion(), exam.getExaminer(), exam.getItems(), exam.getTotalFee(), exam.getRemark());
    }

    @Override
    public int update(PhysicalExam exam) {
        String sql = "UPDATE physical_exam SET patient_id=?, exam_date=?, status=?, conclusion=?, examiner=?, items=?, total_fee=?, remark=? WHERE id=?";
        return JDBCUtil.executeUpdate(sql, exam.getPatientId(), exam.getExamDate(), exam.getStatus(), exam.getConclusion(), exam.getExaminer(), exam.getItems(), exam.getTotalFee(), exam.getRemark(), exam.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM physical_exam WHERE id=?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public PhysicalExam findById(int id) {
        String sql = "SELECT * FROM physical_exam WHERE id=?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToPhysicalExam(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<PhysicalExam> findAll() {
        String sql = "SELECT * FROM physical_exam ORDER BY exam_date DESC";
        List<PhysicalExam> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPhysicalExam(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<PhysicalExam> findByPatientId(int patientId) {
        String sql = "SELECT * FROM physical_exam WHERE patient_id=? ORDER BY exam_date DESC";
        List<PhysicalExam> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, patientId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPhysicalExam(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<PhysicalExam> findByStatus(String status) {
        String sql = "SELECT * FROM physical_exam WHERE status=? ORDER BY exam_date DESC";
        List<PhysicalExam> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, status)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPhysicalExam(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private PhysicalExam mapToPhysicalExam(java.sql.ResultSet rs) throws Exception {
        PhysicalExam pe = new PhysicalExam();
        pe.setId(rs.getInt("id"));
        pe.setPatientId(rs.getInt("patient_id"));
        pe.setExamDate(rs.getString("exam_date"));
        pe.setStatus(rs.getString("status"));
        pe.setConclusion(rs.getString("conclusion"));
        pe.setExaminer(rs.getString("examiner"));
        pe.setItems(rs.getString("items"));
        pe.setTotalFee(rs.getBigDecimal("total_fee"));
        pe.setRemark(rs.getString("remark"));
        return pe;
    }
}