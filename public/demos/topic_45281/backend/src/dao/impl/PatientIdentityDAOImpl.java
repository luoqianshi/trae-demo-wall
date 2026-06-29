package dao.impl;

import bean.PatientIdentity;
import dao.PatientIdentityDAO;
import util.JDBCUtil;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class PatientIdentityDAOImpl implements PatientIdentityDAO {
    @Override
    public int upsert(PatientIdentity identity) {
        String sql = "INSERT INTO patient_identity(patient_id,identity_type,identity_no,verified,primary_flag,status,source) " +
            "VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE patient_id=VALUES(patient_id),verified=VALUES(verified)," +
            "primary_flag=VALUES(primary_flag),status=VALUES(status),source=VALUES(source),updated_at=NOW()";
        return JDBCUtil.executeUpdate(sql,
            identity.getPatientId(),
            identity.getIdentityType(),
            identity.getIdentityNo(),
            identity.getVerified(),
            identity.getPrimaryFlag(),
            identity.getStatus(),
            identity.getSource()
        );
    }

    @Override
    public List<PatientIdentity> findByPatientId(long patientId) {
        return query("SELECT * FROM patient_identity WHERE patient_id=? ORDER BY primary_flag DESC,id ASC", patientId);
    }

    @Override
    public List<PatientIdentity> findByIdentity(String identityType, String identityNo) {
        return query(
            "SELECT * FROM patient_identity WHERE identity_type=? AND identity_no=? AND status='active' ORDER BY primary_flag DESC,id ASC",
            identityType,
            identityNo
        );
    }

    @Override
    public int moveToPatient(long fromPatientId, long toPatientId) {
        return JDBCUtil.executeUpdate("UPDATE patient_identity SET patient_id=?,updated_at=NOW() WHERE patient_id=?", toPatientId, fromPatientId);
    }

    private List<PatientIdentity> query(String sql, Object... params) {
        List<PatientIdentity> list = new ArrayList<>();
        JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params);
        try {
            if (qr != null) {
                ResultSet rs = qr.getResultSet();
                while (rs.next()) list.add(map(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (qr != null) qr.close();
        }
        return list;
    }

    private PatientIdentity map(ResultSet rs) throws SQLException {
        PatientIdentity identity = new PatientIdentity();
        identity.setId(rs.getLong("id"));
        identity.setPatientId(rs.getLong("patient_id"));
        identity.setIdentityType(rs.getString("identity_type"));
        identity.setIdentityNo(rs.getString("identity_no"));
        identity.setVerified(rs.getInt("verified"));
        identity.setPrimaryFlag(rs.getInt("primary_flag"));
        identity.setStatus(rs.getString("status"));
        identity.setSource(rs.getString("source"));
        identity.setCreatedAt(rs.getTimestamp("created_at"));
        identity.setUpdatedAt(rs.getTimestamp("updated_at"));
        return identity;
    }
}
