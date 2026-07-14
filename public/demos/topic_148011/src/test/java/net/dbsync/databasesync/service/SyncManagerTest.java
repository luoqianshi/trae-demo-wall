package net.dbsync.databasesync.service;

import net.dbsync.databasesync.config.DatabaseSyncConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.sql.SQLException;

@SpringBootTest
class SyncManagerTest {

    private final DatabaseSyncConfig databaseSyncConfig;

    @Autowired
    public SyncManagerTest(DatabaseSyncConfig databaseSyncConfig) {
        this.databaseSyncConfig = databaseSyncConfig;
    }

    @Test
    void testSynchronize() throws SQLException {
        // 注意：这个测试需要实际的数据库连接
        // 在实际运行前，需要确保配置文件中的数据库连接信息正确
        // 并且源数据库中存在相应的表和数据
        
        SyncManager syncManager = new SyncManager();
        
        // 测试第一个同步对
        if (!databaseSyncConfig.getSyncPairs().isEmpty()) {
            DatabaseSyncConfig.SyncPair syncPair = databaseSyncConfig.getSyncPairs().get(0);
            syncManager.synchronize(syncPair);
        }
    }
}
