package dao.impl;
import bean.UserPermission;
import dao.UserPermissionDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class UserPermissionDAOImpl implements UserPermissionDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(UserPermission p){return JDBCUtil.executeInsert("INSERT INTO user_permission(user_id,module_code,permission_type,granted_by,expire_time,status,remark)VALUES(?,?,?,?,?,?,?)",p.getUserId(),p.getModuleCode(),p.getPermissionType(),p.getGrantedBy(),p.getExpireTime(),p.getStatus(),p.getRemark());}
    @Override public int update(UserPermission p){return JDBCUtil.executeUpdate("UPDATE user_permission SET permission_type=?,expire_time=?,status=?,remark=?WHERE id=?",p.getPermissionType(),p.getExpireTime(),p.getStatus(),p.getRemark(),p.getId());}
    @Override public UserPermission findById(int id){List<UserPermission>l=queryList("SELECT*FROM user_permission WHERE id=?",this::mapUP,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<UserPermission> findByUserId(int userId){return queryList("SELECT*FROM user_permission WHERE user_id=?ORDER BY module_code",this::mapUP,userId);}
    @Override public List<UserPermission> findPermissions(String moduleCode,String status,int page,int size){String sql="SELECT*FROM user_permission WHERE 1=1";List<Object>params=new ArrayList<>();if(moduleCode!=null&&!moduleCode.isEmpty()){sql+=" AND module_code=?";params.add(moduleCode);}if(status!=null&&!status.isEmpty()){sql+=" AND status=?";params.add(status);}sql+=" ORDER BY module_code LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapUP,params.toArray(new Object[0]));}
    private UserPermission mapUP(ResultSet rs){try{UserPermission p=new UserPermission();p.setId(rs.getInt("id"));p.setUserId(rs.getInt("user_id"));p.setModuleCode(rs.getString("module_code"));p.setPermissionType(rs.getString("permission_type"));p.setGrantedBy(rs.getInt("granted_by"));p.setGrantTime(rs.getTimestamp("grant_time"));p.setExpireTime(rs.getTimestamp("expire_time"));p.setStatus(rs.getString("status"));p.setRemark(rs.getString("remark"));p.setCreateTime(rs.getTimestamp("create_time"));p.setUpdateTime(rs.getTimestamp("update_time"));return p;}catch(SQLException e){return null;}}
}
