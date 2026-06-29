package dao.impl;
import bean.HrStaff;
import dao.HrStaffDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class HrStaffDAOImpl implements HrStaffDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(HrStaff h){return JDBCUtil.executeInsert("INSERT INTO hr_staff(staff_no,name,gender,birth_date,id_card,phone,email,dept_id,dept_name,position,title,education,hire_date,staff_type,salary_level,work_status,emergency_contact,emergency_phone,remark)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",h.getStaffNo(),h.getName(),h.getGender(),h.getBirthDate(),h.getIdCard(),h.getPhone(),h.getEmail(),h.getDeptId(),h.getDeptName(),h.getPosition(),h.getTitle(),h.getEducation(),h.getHireDate(),h.getStaffType(),h.getSalaryLevel(),h.getWorkStatus(),h.getEmergencyContact(),h.getEmergencyPhone(),h.getRemark());}
    @Override public int update(HrStaff h){return JDBCUtil.executeUpdate("UPDATE hr_staff SET position=?,title=?,salary_level=?,work_status=?,leave_date=?,remark=?WHERE id=?",h.getPosition(),h.getTitle(),h.getSalaryLevel(),h.getWorkStatus(),h.getLeaveDate(),h.getRemark(),h.getId());}
    @Override public HrStaff findById(int id){List<HrStaff>l=queryList("SELECT*FROM hr_staff WHERE id=?",this::mapHS,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<HrStaff> findByDeptId(int deptId){return queryList("SELECT*FROM hr_staff WHERE dept_id=?ORDER BY staff_no",this::mapHS,deptId);}
    @Override public List<HrStaff> findStaff(String workStatus,String staffType,int page,int size){String sql="SELECT*FROM hr_staff WHERE 1=1";List<Object>params=new ArrayList<>();if(workStatus!=null&&!workStatus.isEmpty()){sql+=" AND work_status=?";params.add(workStatus);}if(staffType!=null&&!staffType.isEmpty()){sql+=" AND staff_type=?";params.add(staffType);}sql+=" ORDER BY staff_no LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapHS,params.toArray(new Object[0]));}
    private HrStaff mapHS(ResultSet rs){try{HrStaff h=new HrStaff();h.setId(rs.getInt("id"));h.setStaffNo(rs.getString("staff_no"));h.setName(rs.getString("name"));h.setGender(rs.getString("gender"));h.setBirthDate(rs.getDate("birth_date"));h.setIdCard(rs.getString("id_card"));h.setPhone(rs.getString("phone"));h.setEmail(rs.getString("email"));h.setDeptId(rs.getInt("dept_id"));h.setDeptName(rs.getString("dept_name"));h.setPosition(rs.getString("position"));h.setTitle(rs.getString("title"));h.setEducation(rs.getString("education"));h.setHireDate(rs.getDate("hire_date"));h.setLeaveDate(rs.getDate("leave_date"));h.setStaffType(rs.getString("staff_type"));h.setSalaryLevel(rs.getString("salary_level"));h.setSkillCertificates(rs.getString("skill_certificates"));h.setWorkStatus(rs.getString("work_status"));h.setEmergencyContact(rs.getString("emergency_contact"));h.setEmergencyPhone(rs.getString("emergency_phone"));h.setRemark(rs.getString("remark"));h.setCreateTime(rs.getTimestamp("create_time"));h.setUpdateTime(rs.getTimestamp("update_time"));return h;}catch(SQLException e){return null;}}
}
