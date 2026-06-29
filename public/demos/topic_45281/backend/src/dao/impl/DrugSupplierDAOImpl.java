package dao.impl;

import bean.DrugSupplier;
import dao.DrugSupplierDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class DrugSupplierDAOImpl implements DrugSupplierDAO {

    @Override public int insert(DrugSupplier s) {
        return JDBCUtil.executeInsert("INSERT INTO drug_supplier(supplier_code,supplier_name,supplier_short_name,contact_person,contact_phone,contact_address,business_license,drug_license,gsp_certificate,qualification_expiry,bank_name,bank_account,tax_no,supplier_rating,cooperation_status,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            s.getSupplierCode(), s.getSupplierName(), s.getSupplierShortName(), s.getContactPerson(), s.getContactPhone(),
            s.getContactAddress(), s.getBusinessLicense(), s.getDrugLicense(), s.getGspCertificate(),
            s.getQualificationExpiry(), s.getBankName(), s.getBankAccount(), s.getTaxNo(),
            s.getSupplierRating(), s.getCooperationStatus(), s.getRemark());
    }
    @Override public int update(DrugSupplier s) {
        return JDBCUtil.executeUpdate("UPDATE drug_supplier SET supplier_name=?,contact_person=?,contact_phone=?,cooperation_status=?,supplier_rating=?,remark=? WHERE id=?",
            s.getSupplierName(), s.getContactPerson(), s.getContactPhone(), s.getCooperationStatus(),
            s.getSupplierRating(), s.getRemark(), s.getId());
    }
    @Override public List<DrugSupplier> findAll(String keyword) {
        String sql = "SELECT * FROM drug_supplier WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (keyword != null && !keyword.isEmpty()) {
            sql += " AND (supplier_name LIKE ? OR supplier_code LIKE ?)"; args.add("%" + keyword + "%"); args.add("%" + keyword + "%");
        }
        sql += " ORDER BY id DESC";
        return queryList(sql, args.toArray());
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM drug_supplier WHERE id=?", id);
    }

    private List<DrugSupplier> queryList(String sql, Object... params) {
        List<DrugSupplier> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private DrugSupplier mapRow(ResultSet rs) throws SQLException {
        DrugSupplier s = new DrugSupplier();
        s.setId(rs.getInt("id")); s.setSupplierCode(rs.getString("supplier_code")); s.setSupplierName(rs.getString("supplier_name"));
        s.setSupplierShortName(rs.getString("supplier_short_name")); s.setContactPerson(rs.getString("contact_person"));
        s.setContactPhone(rs.getString("contact_phone")); s.setContactAddress(rs.getString("contact_address"));
        s.setBusinessLicense(rs.getString("business_license")); s.setDrugLicense(rs.getString("drug_license"));
        s.setGspCertificate(rs.getString("gsp_certificate")); s.setQualificationExpiry(rs.getDate("qualification_expiry"));
        s.setBankName(rs.getString("bank_name")); s.setBankAccount(rs.getString("bank_account"));
        s.setTaxNo(rs.getString("tax_no")); s.setSupplierRating(rs.getInt("supplier_rating"));
        s.setCooperationStatus(rs.getString("cooperation_status")); s.setRemark(rs.getString("remark"));
        s.setCreateTime(rs.getTimestamp("create_time")); s.setUpdateTime(rs.getTimestamp("update_time"));
        return s;
    }
}