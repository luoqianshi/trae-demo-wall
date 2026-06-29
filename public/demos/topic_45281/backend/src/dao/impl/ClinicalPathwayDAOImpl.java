package dao.impl;
import bean.ClinicalPathway;
import dao.ClinicalPathwayDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class ClinicalPathwayDAOImpl implements ClinicalPathwayDAO {
    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet,T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) { ResultSet rs = qr.getResultSet(); while(rs.next()) list.add(mapper.apply(rs)); } catch(Exception e){ e.printStackTrace(); }
        return list;
    }
    @Override public int insert(ClinicalPathway p){return JDBCUtil.executeInsert("INSERT INTO clinical_pathway(pathway_code,pathway_name,disease_icd,disease_name,version,target_days,department,entry_criteria,exclusion_criteria,variation_types,status,creator_id,creator_name)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",p.getPathwayCode(),p.getPathwayName(),p.getDiseaseIcd(),p.getDiseaseName(),p.getVersion(),p.getTargetDays(),p.getDepartment(),p.getEntryCriteria(),p.getExclusionCriteria(),p.getVariationTypes(),p.getStatus(),p.getCreatorId(),p.getCreatorName());}
    @Override public int update(ClinicalPathway p){return JDBCUtil.executeUpdate("UPDATE clinical_pathway SET pathway_name=?,disease_icd=?,disease_name=?,version=?,target_days=?,department=?,entry_criteria=?,exclusion_criteria=?,variation_types=?,status=?WHERE id=?",p.getPathwayName(),p.getDiseaseIcd(),p.getDiseaseName(),p.getVersion(),p.getTargetDays(),p.getDepartment(),p.getEntryCriteria(),p.getExclusionCriteria(),p.getVariationTypes(),p.getStatus(),p.getId());}
    @Override public ClinicalPathway findById(int id){List<ClinicalPathway>l=queryList("SELECT*FROM clinical_pathway WHERE id=?",this::mapCP,id);return l.isEmpty()?null:l.get(0);}
    @Override public List<ClinicalPathway> findPathways(String status,int page,int size){String sql="SELECT*FROM clinical_pathway WHERE 1=1";List<Object>params=new ArrayList<>();if(status!=null&&!status.isEmpty()){sql+=" AND status=?";params.add(status);}sql+=" ORDER BY create_time DESC LIMIT ?,?";params.add((page-1)*size);params.add(size);return queryList(sql,this::mapCP,params.toArray(new Object[0]));}
    private ClinicalPathway mapCP(ResultSet rs){try{ClinicalPathway p=new ClinicalPathway();p.setId(rs.getInt("id"));p.setPathwayCode(rs.getString("pathway_code"));p.setPathwayName(rs.getString("pathway_name"));p.setDiseaseIcd(rs.getString("disease_icd"));p.setDiseaseName(rs.getString("disease_name"));p.setVersion(rs.getString("version"));if(rs.getObject("target_days")!=null)p.setTargetDays(rs.getInt("target_days"));p.setDepartment(rs.getString("department"));p.setEntryCriteria(rs.getString("entry_criteria"));p.setExclusionCriteria(rs.getString("exclusion_criteria"));p.setVariationTypes(rs.getString("variation_types"));p.setStatus(rs.getString("status"));if(rs.getObject("creator_id")!=null)p.setCreatorId(rs.getInt("creator_id"));p.setCreatorName(rs.getString("creator_name"));p.setCreateTime(rs.getTimestamp("create_time"));p.setUpdateTime(rs.getTimestamp("update_time"));return p;}catch(SQLException e){return null;}}
}
