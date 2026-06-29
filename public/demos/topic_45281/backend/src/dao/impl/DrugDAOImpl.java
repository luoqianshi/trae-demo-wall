package dao.impl;

import util.JDBCUtil;
import bean.Drug;
import dao.DrugDAO;
import java.util.ArrayList;
import java.util.List;

public class DrugDAOImpl implements DrugDAO {
    @Override
    public int insert(Drug drug) {
        String sql = "INSERT INTO drug(name, spec, unit, price, stock, stock_warn, expire_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, drug.getName(), drug.getSpec(), drug.getUnit(), drug.getPrice(), drug.getStock(), drug.getStockWarn(), drug.getExpireDate(), drug.getRemark());
    }

    @Override
    public int update(Drug drug) {
        String sql = "UPDATE drug SET name = ?, spec = ?, unit = ?, price = ?, stock = ?, stock_warn = ?, expire_date = ?, remark = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, drug.getName(), drug.getSpec(), drug.getUnit(), drug.getPrice(), drug.getStock(), drug.getStockWarn(), drug.getExpireDate(), drug.getRemark(), drug.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM drug WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Drug findById(int id) {
        String sql = "SELECT * FROM drug WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToDrug(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Drug> findAll() {
        String sql = "SELECT * FROM drug";
        List<Drug> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToDrug(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Drug> findByKeyword(String keyword) {
        String sql = "SELECT * FROM drug WHERE name LIKE ? OR spec LIKE ?";
        List<Drug> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, "%" + keyword + "%", "%" + keyword + "%")) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToDrug(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public int updateStock(int drugId, int num) {
        String sql = "UPDATE drug SET stock = stock + ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, num, drugId);
    }

    @Override
    public List<Drug> findLowStock() {
        String sql = "SELECT * FROM drug WHERE stock < stock_warn";
        List<Drug> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToDrug(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Drug> findExpiring() {
        String sql = "SELECT * FROM drug WHERE expire_date IS NOT NULL AND expire_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)";
        List<Drug> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToDrug(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Drug> findExpired() {
        String sql = "SELECT * FROM drug WHERE expire_date IS NOT NULL AND expire_date < CURDATE()";
        List<Drug> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToDrug(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public boolean isUsedInPrescription(int drugId) {
        String sql = "SELECT COUNT(*) FROM prescription_item WHERE drug_id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, drugId)) {
            if (qr != null && qr.getResultSet().next()) {
                return qr.getResultSet().getInt(1) > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean isUsedInStockLog(int drugId) {
        String sql = "SELECT COUNT(*) FROM drug_stock_log WHERE drug_id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, drugId)) {
            if (qr != null && qr.getResultSet().next()) {
                return qr.getResultSet().getInt(1) > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    private Drug mapToDrug(java.sql.ResultSet rs) throws Exception {
        Drug drug = new Drug();
        drug.setId(rs.getInt("id"));
        drug.setName(rs.getString("name"));
        drug.setSpec(rs.getString("spec"));
        drug.setUnit(rs.getString("unit"));
        drug.setPrice(rs.getBigDecimal("price"));
        drug.setStock(rs.getInt("stock"));
        drug.setStockWarn(rs.getInt("stock_warn"));
        drug.setExpireDate(rs.getDate("expire_date"));
        drug.setCreateTime(rs.getTimestamp("create_time"));
        drug.setUpdateTime(rs.getTimestamp("update_time"));
        drug.setRemark(rs.getString("remark"));
        return drug;
    }
}
