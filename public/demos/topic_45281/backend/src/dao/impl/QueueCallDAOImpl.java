package dao.impl;

import util.JDBCUtil;
import bean.QueueCall;
import dao.QueueCallDAO;
import java.util.ArrayList;
import java.util.List;

public class QueueCallDAOImpl implements QueueCallDAO {
    @Override
    public int insert(QueueCall queue) {
        String sql = "INSERT INTO queue_calls(registration_id, patient_id, patient_name, doctor_id, doctor_name, dept, queue_no, status, call_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, queue.getRegistrationId(), queue.getPatientId(), queue.getPatientName(), queue.getDoctorId(), queue.getDoctorName(), queue.getDept(), queue.getQueueNo(), queue.getCallStatus(), queue.getCallTime());
    }

    @Override
    public int update(QueueCall queue) {
        String sql = "UPDATE queue_calls SET status = ?, call_time = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, queue.getCallStatus(), queue.getCallTime(), queue.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM queue_calls WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public QueueCall findById(int id) {
        String sql = "SELECT * FROM queue_calls WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToQueueCall(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public QueueCall findByRegistrationId(int registrationId) {
        String sql = "SELECT * FROM queue_calls WHERE registration_id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, registrationId)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToQueueCall(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<QueueCall> findAll() {
        String sql = "SELECT * FROM queue_calls ORDER BY create_time DESC";
        List<QueueCall> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToQueueCall(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<QueueCall> findByDoctorId(int doctorId) {
        String sql = "SELECT * FROM queue_calls WHERE doctor_id = ? ORDER BY create_time ASC";
        List<QueueCall> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, doctorId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToQueueCall(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<QueueCall> findByDeptAndDoctorId(String dept, int doctorId) {
        String sql = "SELECT * FROM queue_calls WHERE dept = ? AND doctor_id = ? ORDER BY create_time ASC";
        List<QueueCall> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, dept, doctorId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToQueueCall(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<QueueCall> findByCallStatus(String callStatus) {
        String sql = "SELECT * FROM queue_calls WHERE status = ? ORDER BY create_time ASC";
        List<QueueCall> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, callStatus)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToQueueCall(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<QueueCall> findByDept(String dept) {
        String sql = "SELECT * FROM queue_calls WHERE dept = ? ORDER BY create_time ASC";
        List<QueueCall> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, dept)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToQueueCall(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private QueueCall mapToQueueCall(java.sql.ResultSet rs) throws Exception {
        QueueCall queue = new QueueCall();
        queue.setId(rs.getInt("id"));
        queue.setRegistrationId(rs.getInt("registration_id"));
        queue.setPatientId(rs.getInt("patient_id"));
        queue.setPatientName(rs.getString("patient_name"));
        queue.setDept(rs.getString("dept"));
        queue.setDoctorId(rs.getInt("doctor_id"));
        queue.setDoctorName(rs.getString("doctor_name"));
        queue.setQueueNo(rs.getString("queue_no"));
        queue.setQueueTime(rs.getTimestamp("create_time"));
        queue.setCallStatus(rs.getString("status"));
        queue.setCallTime(rs.getTimestamp("call_time"));
        queue.setOperator(rs.getString("doctor_name"));
        return queue;
    }
}
