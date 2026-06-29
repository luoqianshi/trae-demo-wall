package dao.impl;
import bean.CostAccounting;
import dao.CostAccountingDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class CostAccountingDAOImpl implements CostAccountingDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(CostAccounting c){return JDBCUtil.executeInsert("INSERT INTO cost_accounting(account_no,account_period,dept_id,dept_name,personnel_cost,material_cost,equipment_cost,drug_cost,management_cost,other_cost,total_cost,revenue,profit,cost_per_bed_day,cost_per_visit,accountant_id,accountant_name,account_date,status,remark)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",c.getAccountNo(),c.getAccountPeriod(),c.getDeptId(),c.getDeptName(),c.getPersonnelCost(),c.getMaterialCost(),c.getEquipmentCost(),c.getDrugCost(),c.getManagementCost(),c.getOtherCost(),c.getTotalCost(),c.getRevenue(),c.getProfit(),c.getCostPerBedDay(),c.getCostPerVisit(),c.getAccountantId(),c.getAccountantName(),c.getAccountDate(),c.getStatus(),c.getRemark());}
    @Override public int update(CostAccounting c){return JDBCUtil.executeUpdate("UPDATE cost_accounting SET status=?,remark=?WHERE id=?",c.getStatus(),c.getRemark(),c.getId());}
    @Override public CostAccounting findById(int id){List<CostAccounting>l=queryList("SELECT*FROM cost_accounting WHERE id=?",this::mapCA,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<CostAccounting> findByDeptId(int deptId){return queryList("SELECT*FROM cost_accounting WHERE dept_id=?ORDER BY account_period DESC",this::mapCA,deptId);}
    @Override public List<CostAccounting> findAccounts(String accountPeriod,String status,int page,int size){String sql="SELECT*FROM cost_accounting WHERE 1=1";List<Object>params=new ArrayList<>();if(accountPeriod!=null&&!accountPeriod.isEmpty()){sql+=" AND account_period=?";params.add(accountPeriod);}if(status!=null&&!status.isEmpty()){sql+=" AND status=?";params.add(status);}sql+=" ORDER BY account_period DESC LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapCA,params.toArray(new Object[0]));}
    private CostAccounting mapCA(ResultSet rs){try{CostAccounting c=new CostAccounting();c.setId(rs.getInt("id"));c.setAccountNo(rs.getString("account_no"));c.setAccountPeriod(rs.getString("account_period"));c.setDeptId(rs.getInt("dept_id"));c.setDeptName(rs.getString("dept_name"));c.setPersonnelCost(rs.getBigDecimal("personnel_cost"));c.setMaterialCost(rs.getBigDecimal("material_cost"));c.setEquipmentCost(rs.getBigDecimal("equipment_cost"));c.setDrugCost(rs.getBigDecimal("drug_cost"));c.setManagementCost(rs.getBigDecimal("management_cost"));c.setOtherCost(rs.getBigDecimal("other_cost"));c.setTotalCost(rs.getBigDecimal("total_cost"));c.setRevenue(rs.getBigDecimal("revenue"));c.setProfit(rs.getBigDecimal("profit"));c.setCostPerBedDay(rs.getBigDecimal("cost_per_bed_day"));c.setCostPerVisit(rs.getBigDecimal("cost_per_visit"));c.setAccountantId(rs.getInt("accountant_id"));c.setAccountantName(rs.getString("accountant_name"));c.setAccountDate(rs.getDate("account_date"));c.setStatus(rs.getString("status"));c.setRemark(rs.getString("remark"));c.setCreateTime(rs.getTimestamp("create_time"));c.setUpdateTime(rs.getTimestamp("update_time"));return c;}catch(SQLException e){return null;}}
}
