package dao.impl;
import bean.BedManagement;
import dao.BedManagementDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class BedManagementDAOImpl implements BedManagementDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(BedManagement b){return JDBCUtil.executeInsert("INSERT INTO bed_management(bed_no,ward_id,ward_name,dept_id,dept_name,bed_type,bed_status,daily_rate,remark)VALUES(?,?,?,?,?,?,?,?,?)",b.getBedNo(),b.getWardId(),b.getWardName(),b.getDeptId(),b.getDeptName(),b.getBedType(),b.getBedStatus(),b.getDailyRate(),b.getRemark());}
    @Override public int update(BedManagement b){return JDBCUtil.executeUpdate("UPDATE bed_management SET bed_status=?,patient_id=?,patient_name=?,admit_time=?,nurse_id=?,nurse_name=?,remark=?WHERE id=?",b.getBedStatus(),b.getPatientId(),b.getPatientName(),b.getAdmitTime(),b.getNurseId(),b.getNurseName(),b.getRemark(),b.getId());}
    @Override public BedManagement findById(int id){List<BedManagement>l=queryList("SELECT*FROM bed_management WHERE id=?",this::mapBM,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<BedManagement> findByDeptId(int deptId){return queryList("SELECT*FROM bed_management WHERE dept_id=?ORDER BY bed_no",this::mapBM,deptId);}
    @Override public List<BedManagement> findBeds(String bedStatus,String bedType,int page,int size){String sql="SELECT*FROM bed_management WHERE 1=1";List<Object>params=new ArrayList<>();if(bedStatus!=null&&!bedStatus.isEmpty()){sql+=" AND bed_status=?";params.add(bedStatus);}if(bedType!=null&&!bedType.isEmpty()){sql+=" AND bed_type=?";params.add(bedType);}sql+=" ORDER BY bed_no LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapBM,params.toArray(new Object[0]));}
    private BedManagement mapBM(ResultSet rs){try{BedManagement b=new BedManagement();b.setId(rs.getInt("id"));b.setBedNo(rs.getString("bed_no"));b.setWardId(rs.getInt("ward_id"));b.setWardName(rs.getString("ward_name"));b.setDeptId(rs.getInt("dept_id"));b.setDeptName(rs.getString("dept_name"));b.setBedType(rs.getString("bed_type"));b.setBedStatus(rs.getString("bed_status"));if(rs.getObject("patient_id")!=null)b.setPatientId(rs.getInt("patient_id"));b.setPatientName(rs.getString("patient_name"));b.setAdmitTime(rs.getTimestamp("admit_time"));b.setDailyRate(rs.getBigDecimal("daily_rate"));if(rs.getObject("nurse_id")!=null)b.setNurseId(rs.getInt("nurse_id"));b.setNurseName(rs.getString("nurse_name"));b.setRemark(rs.getString("remark"));b.setCreateTime(rs.getTimestamp("create_time"));b.setUpdateTime(rs.getTimestamp("update_time"));return b;}catch(SQLException e){return null;}}
}
