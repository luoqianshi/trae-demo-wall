package dao.impl;

import bean.PublicInfo;
import dao.PublicInfoDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class PublicInfoDAOImpl implements PublicInfoDAO {

    @Override public int insert(PublicInfo p) {
        return JDBCUtil.executeInsert("INSERT INTO public_info(title,category,content,summary,cover_image,author,is_top,is_published,publish_time) VALUES(?,?,?,?,?,?,?,?,?)",
            p.getTitle(), p.getCategory(), p.getContent(), p.getSummary(), p.getCoverImage(), p.getAuthor(), p.getIsTop(), p.getIsPublished(), p.getPublishTime());
    }
    @Override public PublicInfo findById(int id) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM public_info WHERE id=?", id)) {
            if (qr != null && qr.getResultSet().next()) { return mapPublicInfo(qr.getResultSet()); }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }
    @Override public List<PublicInfo> findByCategory(String category, int page, int size) {
        String sql = "SELECT * FROM public_info WHERE is_published=1";
        List<Object> params = new ArrayList<>();
        if (category != null && !category.isEmpty()) { sql += " AND category=?"; params.add(category); }
        sql += " ORDER BY is_top DESC, publish_time DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        List<PublicInfo> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params.toArray())) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapPublicInfo(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public int incrementView(int id) { return JDBCUtil.executeUpdate("UPDATE public_info SET view_count=view_count+1 WHERE id=?", id); }
    @Override public int update(PublicInfo p) { return JDBCUtil.executeUpdate("UPDATE public_info SET title=?,category=?,content=?,summary=?,is_published=?,publish_time=? WHERE id=?", p.getTitle(), p.getCategory(), p.getContent(), p.getSummary(), p.getIsPublished(), p.getPublishTime(), p.getId()); }
    @Override public int delete(int id) { return JDBCUtil.executeUpdate("DELETE FROM public_info WHERE id=?", id); }

    private PublicInfo mapPublicInfo(ResultSet rs) throws SQLException {
        PublicInfo p = new PublicInfo();
        p.setId(rs.getInt("id")); p.setTitle(rs.getString("title")); p.setCategory(rs.getString("category"));
        p.setContent(rs.getString("content")); p.setSummary(rs.getString("summary"));
        p.setCoverImage(rs.getString("cover_image")); p.setAuthor(rs.getString("author"));
        p.setViewCount(rs.getInt("view_count")); p.setIsTop(rs.getInt("is_top"));
        p.setIsPublished(rs.getInt("is_published")); p.setPublishTime(rs.getTimestamp("publish_time"));
        p.setCreateTime(rs.getTimestamp("create_time")); p.setUpdateTime(rs.getTimestamp("update_time"));
        return p;
    }
}