package dao.impl;
import bean.EquipmentAsset;
import dao.EquipmentAssetDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class EquipmentAssetDAOImpl implements EquipmentAssetDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(EquipmentAsset e){return JDBCUtil.executeInsert("INSERT INTO equipment_asset(asset_no,asset_name,asset_type,category,brand,model,manufacturer,purchase_date,purchase_price,current_value,dept_id,dept_name,location,custodian_id,custodian_name,warranty_expire,maintenance_cycle,asset_status,remark)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",e.getAssetNo(),e.getAssetName(),e.getAssetType(),e.getCategory(),e.getBrand(),e.getModel(),e.getManufacturer(),e.getPurchaseDate(),e.getPurchasePrice(),e.getCurrentValue(),e.getDeptId(),e.getDeptName(),e.getLocation(),e.getCustodianId(),e.getCustodianName(),e.getWarrantyExpire(),e.getMaintenanceCycle(),e.getAssetStatus(),e.getRemark());}
    @Override public int update(EquipmentAsset e){return JDBCUtil.executeUpdate("UPDATE equipment_asset SET asset_status=?,last_maintenance_date=?,next_maintenance_date=?,remark=?WHERE id=?",e.getAssetStatus(),e.getLastMaintenanceDate(),e.getNextMaintenanceDate(),e.getRemark(),e.getId());}
    @Override public EquipmentAsset findById(int id){List<EquipmentAsset>l=queryList("SELECT*FROM equipment_asset WHERE id=?",this::mapEA,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<EquipmentAsset> findByDeptId(int deptId){return queryList("SELECT*FROM equipment_asset WHERE dept_id=?ORDER BY asset_no",this::mapEA,deptId);}
    @Override public List<EquipmentAsset> findAssets(String assetType,String assetStatus,int page,int size){String sql="SELECT*FROM equipment_asset WHERE 1=1";List<Object>params=new ArrayList<>();if(assetType!=null&&!assetType.isEmpty()){sql+=" AND asset_type=?";params.add(assetType);}if(assetStatus!=null&&!assetStatus.isEmpty()){sql+=" AND asset_status=?";params.add(assetStatus);}sql+=" ORDER BY asset_no LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapEA,params.toArray(new Object[0]));}
    private EquipmentAsset mapEA(ResultSet rs){try{EquipmentAsset e=new EquipmentAsset();e.setId(rs.getInt("id"));e.setAssetNo(rs.getString("asset_no"));e.setAssetName(rs.getString("asset_name"));e.setAssetType(rs.getString("asset_type"));e.setCategory(rs.getString("category"));e.setBrand(rs.getString("brand"));e.setModel(rs.getString("model"));e.setManufacturer(rs.getString("manufacturer"));e.setPurchaseDate(rs.getDate("purchase_date"));e.setPurchasePrice(rs.getBigDecimal("purchase_price"));e.setCurrentValue(rs.getBigDecimal("current_value"));if(rs.getObject("dept_id")!=null)e.setDeptId(rs.getInt("dept_id"));e.setDeptName(rs.getString("dept_name"));e.setLocation(rs.getString("location"));if(rs.getObject("custodian_id")!=null)e.setCustodianId(rs.getInt("custodian_id"));e.setCustodianName(rs.getString("custodian_name"));e.setWarrantyExpire(rs.getDate("warranty_expire"));e.setLastMaintenanceDate(rs.getDate("last_maintenance_date"));e.setNextMaintenanceDate(rs.getDate("next_maintenance_date"));if(rs.getObject("maintenance_cycle")!=null)e.setMaintenanceCycle(rs.getInt("maintenance_cycle"));e.setAssetStatus(rs.getString("asset_status"));e.setRemark(rs.getString("remark"));e.setCreateTime(rs.getTimestamp("create_time"));e.setUpdateTime(rs.getTimestamp("update_time"));return e;}catch(SQLException ex){return null;}}
}
