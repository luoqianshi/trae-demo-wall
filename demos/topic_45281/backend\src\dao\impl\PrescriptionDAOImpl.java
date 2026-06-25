package dao.impl;

import util.JDBCUtil;
import bean.Prescription;
import dao.PrescriptionDAO;
import java.util.ArrayList;
import java.util.List;

public class PrescriptionDAOImpl implements PrescriptionDAO {
    @Override
    public int insert(Prescription prescription) {
        String sql = "INSERT INTO prescription(patient_id, doctor_id, registration_id, diagnosis, items, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, prescription.getPatientId(), prescription.getDoctorId(), prescription.getRegistrationId(), prescription.getDiagnosis(), prescription.getItems(), prescription.getTotalPrice(), prescription.getStatus());
    }

    @Override
    public int update(Prescription prescription) {
        StringBuilder sql = new StringBuilder("UPDATE prescription SET ");
        List<Object> params = new java.util.ArrayList<>();

        if (prescription.getDiagnosis() != null) {
            sql.append("diagnosis = ?");
            params.add(prescription.getDiagnosis());
        }
        if (prescription.getItems() != null) {
            if (params.size() > 0) sql.append(", ");
            sql.append("items = ?");
            params.add(prescription.getItems());
        }
        if (prescription.getTotalPrice() != null) {
            if (params.size() > 0) sql.append(", ");
            sql.append("total_price = ?");
            params.add(prescription.getTotalPrice());
        }
        if (prescription.getStatus() != null) {
            if (params.size() > 0) sql.append(", ");
            sql.append("status = ?");
            params.add(prescription.getStatus());
        }

        sql.append(" WHERE id = ?");
        params.add(prescription.getId());

        return JDBCUtil.executeUpdate(sql.toString(), params.toArray());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM prescription WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Prescription findById(int id) {
        String sql = "SELECT * FROM prescription WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToPrescription(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Prescription> findAll() {
        String sql = "SELECT * FROM prescription";
        List<Prescription> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescription(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Prescription> findByPatientId(int patientId) {
        String sql = "SELECT * FROM prescription WHERE patient_id = ?";
        List<Prescription> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, patientId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescription(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Prescription> findByDoctorId(int doctorId) {
        String sql = "SELECT * FROM prescription WHERE doctor_id = ?";
        List<Prescription> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, doctorId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescription(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Prescription> findByStatus(String status) {
        String sql = "SELECT * FROM prescription WHERE status = ?";
        List<Prescription> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, status)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescription(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private Prescription mapToPrescription(java.sql.ResultSet rs) throws Exception {
        Prescription prescription = new Prescription();
        prescription.setId(rs.getInt("id"));
        prescription.setPatientId(rs.getInt("patient_id"));
        prescription.setDoctorId(rs.getInt("doctor_id"));
        prescription.setRegistrationId(rs.getInt("registration_id"));
        prescription.setTotalPrice(rs.getBigDecimal("total_price"));
        prescription.setCreateTime(rs.getTimestamp("create_time"));
        prescription.setStatus(rs.getString("status"));
        return prescription;
    }
}
