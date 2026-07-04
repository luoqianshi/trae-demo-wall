package dao.impl;

import bean.FileAsset;
import dao.FileAssetDAO;
import util.JDBCUtil;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class FileAssetDAOImpl implements FileAssetDAO {
    @Override
    public int insert(FileAsset file) {
        return JDBCUtil.executeInsert(
            "INSERT INTO file_asset(file_uuid,original_name,storage_path,mime_type,file_size,file_sha256,category,owner_type,owner_id,uploaded_by) VALUES(?,?,?,?,?,?,?,?,?,?)",
            file.getFileUuid(), file.getOriginalName(), file.getStoragePath(), file.getMimeType(), file.getFileSize(),
            file.getFileSha256(), file.getCategory(), file.getOwnerType(), file.getOwnerId(), file.getUploadedBy()
        );
    }

    @Override
    public FileAsset findById(long id) {
        JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM file_asset WHERE id=? AND deleted=0", id);
        try {
            if (qr != null && qr.getResultSet().next()) return map(qr.getResultSet());
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (qr != null) qr.close();
        }
        return null;
    }

    @Override
    public FileAsset findByUuid(String fileUuid) {
        JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM file_asset WHERE file_uuid=? AND deleted=0", fileUuid);
        try {
            if (qr != null && qr.getResultSet().next()) return map(qr.getResultSet());
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (qr != null) qr.close();
        }
        return null;
    }

    @Override
    public List<FileAsset> findByOwner(String ownerType, Long ownerId) {
        List<FileAsset> list = new ArrayList<>();
        JDBCUtil.QueryResult qr;
        if (ownerType != null && ownerId != null) {
            qr = JDBCUtil.executeQuery(
                "SELECT * FROM file_asset WHERE owner_type=? AND owner_id=? AND deleted=0 ORDER BY uploaded_at DESC",
                ownerType, ownerId
            );
        } else {
            qr = JDBCUtil.executeQuery("SELECT * FROM file_asset WHERE deleted=0 ORDER BY uploaded_at DESC LIMIT 100");
        }
        try {
            if (qr != null) {
                ResultSet rs = qr.getResultSet();
                while (rs.next()) list.add(map(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            if (qr != null) qr.close();
        }
        return list;
    }

    @Override
    public int markDeleted(String fileUuid) {
        return JDBCUtil.executeUpdate("UPDATE file_asset SET deleted=1 WHERE file_uuid=?", fileUuid);
    }

    public static FileAsset map(ResultSet rs) throws SQLException {
        FileAsset f = new FileAsset();
        f.setId(rs.getLong("id"));
        f.setFileUuid(rs.getString("file_uuid"));
        f.setOriginalName(rs.getString("original_name"));
        f.setStoragePath(rs.getString("storage_path"));
        f.setMimeType(rs.getString("mime_type"));
        f.setFileSize(rs.getLong("file_size"));
        f.setFileSha256(rs.getString("file_sha256"));
        f.setCategory(rs.getString("category"));
        f.setOwnerType(rs.getString("owner_type"));
        long ownerId = rs.getLong("owner_id");
        f.setOwnerId(rs.wasNull() ? null : ownerId);
        long uploadedBy = rs.getLong("uploaded_by");
        f.setUploadedBy(rs.wasNull() ? null : uploadedBy);
        f.setUploadedAt(rs.getTimestamp("uploaded_at"));
        f.setDeleted(rs.getInt("deleted"));
        return f;
    }

    public static FileAsset mapAliased(ResultSet rs) throws SQLException {
        FileAsset f = new FileAsset();
        f.setId(rs.getLong("fa_id"));
        f.setFileUuid(rs.getString("file_uuid"));
        f.setOriginalName(rs.getString("original_name"));
        f.setStoragePath(rs.getString("storage_path"));
        f.setMimeType(rs.getString("mime_type"));
        f.setFileSize(rs.getLong("file_size"));
        f.setFileSha256(rs.getString("file_sha256"));
        f.setCategory(rs.getString("category"));
        f.setOwnerType(rs.getString("owner_type"));
        long ownerId = rs.getLong("owner_id");
        f.setOwnerId(rs.wasNull() ? null : ownerId);
        long uploadedBy = rs.getLong("uploaded_by");
        f.setUploadedBy(rs.wasNull() ? null : uploadedBy);
        f.setUploadedAt(rs.getTimestamp("uploaded_at"));
        f.setDeleted(rs.getInt("deleted"));
        return f;
    }
}
