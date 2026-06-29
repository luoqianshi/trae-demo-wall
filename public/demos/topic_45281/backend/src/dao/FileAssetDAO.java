package dao;

import bean.FileAsset;
import java.util.List;

public interface FileAssetDAO {
    int insert(FileAsset file);
    FileAsset findById(long id);
    FileAsset findByUuid(String fileUuid);
    List<FileAsset> findByOwner(String ownerType, Long ownerId);
    int markDeleted(String fileUuid);
}
