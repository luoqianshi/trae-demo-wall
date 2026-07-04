package dao.impl;

import util.JDBCUtil;
import bean.Examination;
import dao.ExaminationDAO;
import java.util.ArrayList;
import java.util.List;

public class ExaminationDAOImpl implements ExaminationDAO {
    @Override
    public int insert(Examination examination) {
        String sql = "INSERT INTO examination(name, category, price, dept, remark) VALUES (?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, examination.getName(), examination.getCategory(), 
            examination.getPrice(), examination.getDept(), examination.getRemark());
    }

    @Override
    public int update(Examination examination) {
        String sql = "UPDATE examination SET name = ?, category = ?, price = ?, dept = ?, remark = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, examination.getName(), examination.getCategory(), 
            examination.getPrice(), examination.getDept(), examination.getRemark(), examination.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM examination WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Examination findById(int id) {
        String sql = "SELECT * FROM examination WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToExamination(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Examination> findAll() {
        String sql = "SELECT * FROM examination ORDER BY category, name";
        List<Examination> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToExamination(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Examination> findByCategory(String category) {
        String sql = "SELECT * FROM examination WHERE category = ? ORDER BY name";
        List<Examination> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, category)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToExamination(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Examination> findByKeyword(String keyword) {
        String sql = "SELECT * FROM examination WHERE name LIKE ? OR dept LIKE ? ORDER BY category, name";
        List<Examination> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, "%" + keyword + "%", "%" + keyword + "%")) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToExamination(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private Examination mapToExamination(java.sql.ResultSet rs) throws Exception {
        Examination examination = new Examination();
        examination.setId(rs.getInt("id"));
        examination.setName(rs.getString("name"));
        examination.setCategory(rs.getString("category"));
        examination.setPrice(rs.getBigDecimal("price"));
        examination.setDept(rs.getString("dept"));
        examination.setRemark(rs.getString("remark"));
        examination.setCreateTime(rs.getTimestamp("create_time"));
        return examination;
    }
}
