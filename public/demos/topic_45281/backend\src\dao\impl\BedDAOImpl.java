package dao.impl;

import bean.Bed;
import dao.BedDAO;
import util.JDBCUtil;
import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;

public class BedDAOImpl implements BedDAO {
    @Override
    public int insert(Bed bed) {
        if (hasColumn("daily_fee")) {
            String sql = "INSERT INTO bed(bed_no, dept, status, type, daily_fee) VALUES (?, ?, ?, ?, ?)";
            return JDBCUtil.executeInsert(sql, bed.getBedNo(), bed.getDept(), bed.getStatus(), bed.getType(), defaultDailyFee(bed.getDailyFee()));
        }
        String sql = "INSERT INTO bed(bed_no, dept, status, type) VALUES (?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, bed.getBedNo(), bed.getDept(), bed.getStatus(), bed.getType());
    }

    @Override
    public int update(Bed bed) {
        if (hasColumn("daily_fee")) {
            String sql = "UPDATE bed SET bed_no=?, dept=?, status=?, type=?, current_patient_id=?, current_patient_name=?, daily_fee=? WHERE id=?";
            return JDBCUtil.executeUpdate(sql, bed.getBedNo(), bed.getDept(), bed.getStatus(), bed.getType(), bed.getCurrentPatientId(), bed.getCurrentPatientName(), defaultDailyFee(bed.getDailyFee()), bed.getId());
        }
        String sql = "UPDATE bed SET bed_no=?, dept=?, status=?, type=?, current_patient_id=?, current_patient_name=? WHERE id=?";
        return JDBCUtil.executeUpdate(sql, bed.getBedNo(), bed.getDept(), bed.getStatus(), bed.getType(), bed.getCurrentPatientId(), bed.getCurrentPatientName(), bed.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM bed WHERE id=?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public int deleteAll() {
        String sql = "DELETE FROM bed WHERE 1=1";
        return JDBCUtil.executeUpdate(sql);
    }

    @Override
    public Bed findById(int id) {
        String sql = "SELECT * FROM bed WHERE id=?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToBed(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Bed> findAll() {
        String sql = "SELECT * FROM bed ORDER BY dept, bed_no";
        List<Bed> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToBed(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Bed> findByDept(String dept) {
        String sql = "SELECT * FROM bed WHERE dept=? ORDER BY bed_no";
        List<Bed> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, dept)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToBed(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Bed> findByStatus(String status) {
        String sql = "SELECT * FROM bed WHERE status=? ORDER BY dept, bed_no";
        List<Bed> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, status)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToBed(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private Bed mapToBed(java.sql.ResultSet rs) throws Exception {
        Bed bed = new Bed();
        bed.setId(rs.getInt("id"));
        bed.setBedNo(rs.getString("bed_no"));
        bed.setDept(rs.getString("dept"));
        bed.setStatus(rs.getString("status"));
        bed.setType(rs.getString("type"));
        try { bed.setCurrentPatientId(rs.getInt("current_patient_id")); } catch (Exception e) { e.printStackTrace(); }
        try { bed.setCurrentPatientName(rs.getString("current_patient_name")); } catch (Exception e) { e.printStackTrace(); }
        try { bed.setDailyFee(rs.getBigDecimal("daily_fee")); } catch (Exception e) { e.printStackTrace(); }
        return bed;
    }

    private BigDecimal defaultDailyFee(BigDecimal fee) {
        return fee != null ? fee : new BigDecimal("50.00");
    }

    private boolean hasColumn(String columnName) {
        String sql = "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bed' AND COLUMN_NAME = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, columnName)) {
            return qr != null && qr.getResultSet().next() && qr.getResultSet().getInt("cnt") > 0;
        } catch (Exception e) {
            return false;
        }
    }
}
