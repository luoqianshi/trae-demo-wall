package dao.impl;

import bean.VitalSign;
import dao.VitalSignDAO;
import util.JDBCUtil;
import java.util.ArrayList;
import java.util.List;

public class VitalSignDAOImpl implements VitalSignDAO {
    @Override
    public int insert(VitalSign vitalSign) {
        String sql = "INSERT INTO vital_sign(inpatient_id, temperature, pulse, blood_pressure_high, blood_pressure_low, oxygen_saturation, respiration, record_time, nurse_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, vitalSign.getInpatientId(), vitalSign.getTemperature(), vitalSign.getPulse(), vitalSign.getBloodPressureHigh(), vitalSign.getBloodPressureLow(), vitalSign.getOxygenSaturation(), vitalSign.getRespiration(), vitalSign.getRecordTime(), vitalSign.getNurseName());
    }

    @Override
    public int update(VitalSign vitalSign) {
        String sql = "UPDATE vital_sign SET inpatient_id=?, temperature=?, pulse=?, blood_pressure_high=?, blood_pressure_low=?, oxygen_saturation=?, respiration=?, record_time=?, nurse_name=? WHERE id=?";
        return JDBCUtil.executeUpdate(sql, vitalSign.getInpatientId(), vitalSign.getTemperature(), vitalSign.getPulse(), vitalSign.getBloodPressureHigh(), vitalSign.getBloodPressureLow(), vitalSign.getOxygenSaturation(), vitalSign.getRespiration(), vitalSign.getRecordTime(), vitalSign.getNurseName(), vitalSign.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM vital_sign WHERE id=?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public VitalSign findById(int id) {
        String sql = "SELECT * FROM vital_sign WHERE id=?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToVitalSign(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<VitalSign> findAll() {
        String sql = "SELECT * FROM vital_sign ORDER BY record_time DESC";
        List<VitalSign> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToVitalSign(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<VitalSign> findByInpatientId(int inpatientId) {
        String sql = "SELECT * FROM vital_sign WHERE inpatient_id=? ORDER BY record_time DESC";
        List<VitalSign> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, inpatientId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToVitalSign(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public VitalSign findLatestByInpatientId(int inpatientId) {
        String sql = "SELECT * FROM vital_sign WHERE inpatient_id=? ORDER BY record_time DESC LIMIT 1";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, inpatientId)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToVitalSign(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private VitalSign mapToVitalSign(java.sql.ResultSet rs) throws Exception {
        VitalSign vs = new VitalSign();
        vs.setId(rs.getInt("id"));
        vs.setInpatientId(rs.getInt("inpatient_id"));
        vs.setTemperature(rs.getDouble("temperature"));
        vs.setPulse(rs.getInt("pulse"));
        vs.setBloodPressureHigh(rs.getInt("blood_pressure_high"));
        vs.setBloodPressureLow(rs.getInt("blood_pressure_low"));
        vs.setOxygenSaturation(rs.getInt("oxygen_saturation"));
        vs.setRespiration(rs.getInt("respiration"));
        vs.setRecordTime(rs.getTimestamp("record_time"));
        vs.setNurseName(rs.getString("nurse_name"));
        return vs;
    }
}