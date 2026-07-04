package dao.impl;

import util.JDBCUtil;
import bean.MedicalRecordVersion;
import dao.MedicalRecordVersionDAO;
import java.util.ArrayList;
import java.util.List;

public class MedicalRecordVersionDAOImpl implements MedicalRecordVersionDAO {
    @Override
    public int insert(MedicalRecordVersion version) {
        String sql = "INSERT INTO medical_record_version(record_id, content, update_time, operator_id) VALUES (?, ?, ?, ?)";
        return JDBCUtil.executeUpdate(sql, version.getRecordId(), version.getContent(), version.getUpdateTime(), version.getOperatorId());
    }

    @Override
    public int update(MedicalRecordVersion version) {
        String sql = "UPDATE medical_record_version SET record_id = ?, content = ?, update_time = ?, operator_id = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, version.getRecordId(), version.getContent(), version.getUpdateTime(), version.getOperatorId(), version.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM medical_record_version WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public MedicalRecordVersion findById(int id) {
        String sql = "SELECT * FROM medical_record_version WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToMedicalRecordVersion(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<MedicalRecordVersion> findAll() {
        String sql = "SELECT * FROM medical_record_version ORDER BY update_time DESC";
        List<MedicalRecordVersion> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToMedicalRecordVersion(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<MedicalRecordVersion> findByRecordId(int recordId) {
        String sql = "SELECT * FROM medical_record_version WHERE record_id = ? ORDER BY update_time DESC";
        List<MedicalRecordVersion> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, recordId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToMedicalRecordVersion(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private MedicalRecordVersion mapToMedicalRecordVersion(java.sql.ResultSet rs) throws Exception {
        MedicalRecordVersion version = new MedicalRecordVersion();
        version.setId(rs.getInt("id"));
        version.setRecordId(rs.getInt("record_id"));
        version.setContent(rs.getString("content"));
        version.setUpdateTime(rs.getTimestamp("update_time"));
        version.setOperatorId(rs.getInt("operator_id"));
        return version;
    }
}
