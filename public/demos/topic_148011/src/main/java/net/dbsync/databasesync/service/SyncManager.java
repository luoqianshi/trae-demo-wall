package net.dbsync.databasesync.service;

import net.dbsync.databasesync.config.DatabaseSyncConfig;
import net.dbsync.databasesync.datasource.DataSourceFactory;
import lombok.extern.slf4j.Slf4j;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public class SyncManager {

    private final SchemaSynchronizer schemaSynchronizer = new SchemaSynchronizer();
    private final DataSynchronizer dataSynchronizer = new DataSynchronizer();
    private final Map<String, DataSource> dataSourceCache = new HashMap<>();

    public void synchronize(DatabaseSyncConfig.SyncPair syncPair) throws SQLException {
        DataSource sourceDataSource = getOrCreateDataSource(syncPair.getSource());
        DataSource targetDataSource = getOrCreateDataSource(syncPair.getTarget());

        int successCount = 0;
        int failCount = 0;

        for (DatabaseSyncConfig.TableConfig tableConfig : syncPair.getTables()) {
            String tableName = tableConfig.getTable();
            String sourceTableName = tableConfig.getSourceTable();
            String targetTableName = tableConfig.getTargetTable();
            if (sourceTableName == null || sourceTableName.isEmpty()) {
                sourceTableName = tableName;
            }
            if (targetTableName == null || targetTableName.isEmpty()) {
                targetTableName = tableName;
            }
            String syncMode = tableConfig.getSyncMode();

            try {
                log.info("Synchronizing table: {} -> {}, syncMode: {}", sourceTableName, targetTableName, syncMode);
                if (tableConfig.isSyncSchema() && syncPair.getSource().getType().equals("mysql") && syncPair.getTarget().getType().equals("mysql")) {
                    schemaSynchronizer.synchronizeSchema(sourceDataSource, targetDataSource, sourceTableName, targetTableName);
                    log.info("Schema synchronized for table: {} -> {}", sourceTableName, targetTableName);
                }

                List<String> identifierColumns = null;
                String identifierExpression = null;
                DatabaseSyncConfig.ZhConverterConfig zhConverterConfig = null;
                if (tableConfig.getIncrementalConfig() != null) {
                    identifierColumns = tableConfig.getIncrementalConfig().getIdentifierColumns();
                    identifierExpression = tableConfig.getIncrementalConfig().getIdentifierExpression();
                }
                if (tableConfig.getZhConverterConfig() != null) {
                    zhConverterConfig = tableConfig.getZhConverterConfig();
                    log.info("ZH converter enabled: {}, direction: {}", zhConverterConfig.isEnabled(), zhConverterConfig.getDirection());
                }

                log.info("Data synchronization started for table: {} -> {}", sourceTableName, targetTableName);
                dataSynchronizer.synchronizeData(sourceDataSource, targetDataSource, sourceTableName, targetTableName, syncMode, identifierColumns, identifierExpression, zhConverterConfig);

                log.info("Table synchronized successfully: {} -> {}, syncMode: {}", sourceTableName, targetTableName, syncMode);
                successCount++;
            } catch (Exception e) {
                failCount++;
                log.error("Failed to synchronize table: {} -> {}, error: {}", sourceTableName, targetTableName, e.getMessage(), e);
            }
        }

        log.info("Sync pair '{}' completed: {} tables succeeded, {} tables failed", syncPair.getName(), successCount, failCount);

        if (failCount > 0 && successCount == 0) {
            throw new SQLException("All tables failed to synchronize in sync pair: " + syncPair.getName());
        }
    }

    private DataSource getOrCreateDataSource(DatabaseSyncConfig.DatabaseConfig config) {
        String key = config.getType() + "_" + config.getUrl() + "_" + config.getUsername();
        return dataSourceCache.computeIfAbsent(key, k -> DataSourceFactory.createDataSource(config));
    }

    public void clearCache() {
        dataSourceCache.clear();
    }
}
