package net.dbsync.databasesync.service;

import lombok.extern.slf4j.Slf4j;
import net.dbsync.databasesync.config.DatabaseSyncConfig;
import net.dbsync.databasesync.service.TableMetadataService.ColumnMetadata;
import net.dbsync.databasesync.service.TableMetadataService.TableMetadata;
import net.dbsync.databasesync.util.ZHConverter;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
public class DataSynchronizer {

    private final TableMetadataService tableMetadataService = new TableMetadataService();

    public void synchronizeData(DataSource sourceDataSource, DataSource targetDataSource,
                               String sourceTableName, String targetTableName, String syncMode,
                               List<String> identifierColumns, String identifierExpression,
                               DatabaseSyncConfig.ZhConverterConfig zhConverterConfig) throws SQLException, IllegalAccessException {
        if ("full".equals(syncMode)) {
            // 全量同步：先清空目标表，再插入所有数据
            fullSync(sourceDataSource, targetDataSource, sourceTableName, targetTableName, zhConverterConfig);
        } else if ("incremental".equals(syncMode)) {
            // 增量同步：只同步新增或修改的数据
            incrementalSync(sourceDataSource, targetDataSource, sourceTableName, targetTableName, identifierColumns, identifierExpression, zhConverterConfig);
        }
    }

    private void fullSync(DataSource sourceDataSource, DataSource targetDataSource, 
                         String sourceTableName, String targetTableName, 
                         DatabaseSyncConfig.ZhConverterConfig zhConverterConfig) throws SQLException, IllegalAccessException {
        String deleteSql = "DELETE FROM " + targetTableName;
        String selectSql = "SELECT * FROM " + sourceTableName;
        log.info("Executing SQL: {}", deleteSql);
        log.info("Executing SQL: {}", selectSql);

        try (Connection sourceConn = sourceDataSource.getConnection();
             Connection targetConn = targetDataSource.getConnection()) {
            targetConn.setAutoCommit(false);

            try {
                try (Statement stmt = targetConn.createStatement()) {
                    stmt.executeUpdate(deleteSql);
                }

                try (Statement sourceStmt = sourceConn.createStatement();
                     ResultSet rs = sourceStmt.executeQuery(selectSql)) {
                    
                    ResultSetMetaData metaData = rs.getMetaData();
                    SyncColumnMapping columnMapping = resolveSyncColumns(
                            getTargetColumnNames(targetDataSource, targetTableName), metaData, targetTableName);
                    int columnCount = columnMapping.size();
                    
                    String insertSqlStr = buildInsertSql(targetTableName, columnMapping.getTargetColumns());
                    log.info("Preparing SQL: {}", insertSqlStr);
                    
                    try (PreparedStatement pstmt = targetConn.prepareStatement(insertSqlStr)) {
                        int batchSize = 1000;
                        int count = 0;
                        
                        while (rs.next()) {
                            bindRowValues(pstmt, rs, columnMapping, 1, zhConverterConfig);
                            
                            if (count % 100 == 0) {
                                log.debug("Executing SQL: {}", buildSqlWithParams(insertSqlStr, rs, columnMapping, 1, zhConverterConfig));
                            }
                            
                            pstmt.addBatch();
                            count++;
                            
                            if (count % batchSize == 0) {
                                pstmt.executeBatch();
                                log.debug("Executed batch of {} records", batchSize);
                            }
                        }
                        
                        if (count % batchSize != 0) {
                            pstmt.executeBatch();
                            log.debug("Executed final batch of {} records", count % batchSize);
                        }
                        
                        targetConn.commit();
                        log.info("Synchronized {} records from {} to {}", count, sourceTableName, targetTableName);
                    }
                }
            } catch (SQLException e) {
                targetConn.rollback();
                log.error("Full sync failed, transaction rolled back for table {} -> {}", sourceTableName, targetTableName, e);
                throw e;
            }
        }
    }

    private String convertString(String value, String direction) throws IllegalAccessException {
        if (value == null || direction == null) {
            return value;
        }
        
        ZHConverter.target target;
        if ("s2t".equals(direction)) {
            target = ZHConverter.target.TCcharacter; // 简体到繁体
        } else if ("t2s".equals(direction)) {
            target = ZHConverter.target.SCcharacter; // 繁体到简体
        } else {
            log.warn("Invalid zhConverter direction: {}", direction);
            return value;
        }
        
        try {
            return ZHConverter.transformation(value, target);
        } catch (Exception e) {
            log.error("Failed to convert string: ", e);
            return value;
        }
    }

    private void syncDeletedRecords(DataSource sourceDataSource, DataSource targetDataSource,
                                   String sourceTableName, String targetTableName,
                                   List<String> configIdentifierColumns, String identifierExpression) throws SQLException {
        log.info("Starting to sync deleted records from {} to {} (using sync table)", sourceTableName, targetTableName);

        try {
            // 1. 确定主键字段（优先级：配置 > 自动检测 > 默认值）
            String[] primaryKeyColumns = resolvePrimaryKeyColumns(sourceDataSource, sourceTableName, configIdentifierColumns);

            // 2. 使用实体同步表方式删除孤儿记录
            int deletedCount = deleteOrphanedRecords(targetDataSource, targetTableName, primaryKeyColumns,
                                                     sourceDataSource, sourceTableName);

            if (deletedCount > 0) {
                log.info("Deleted {} orphaned records from {} that no longer exist in {}",
                        deletedCount, targetTableName, sourceTableName);
            } else {
                log.info("No deleted records to sync");
            }

            log.info("Sync deleted records completed: {} records removed", deletedCount);
        } catch (SQLException e) {
            log.error("Error syncing deleted records: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 解析用于删除同步的主键列
     * 优先级：配置的 identifierColumns > 数据库主键 > 默认值
     */
    private String[] resolvePrimaryKeyColumns(DataSource dataSource, String tableName,
                                              List<String> configIdentifierColumns) throws SQLException {

        // 优先级 1: 使用配置的标识符列
        if (configIdentifierColumns != null && !configIdentifierColumns.isEmpty()) {
            log.info("Using configured identifier columns for delete sync: {}", configIdentifierColumns);
            return configIdentifierColumns.toArray(new String[0]);
        }

        // 优先级 2: 自动检测数据库主键
        try {
            TableMetadataService tableMetadataService = new TableMetadataService();
            TableMetadata metadata = tableMetadataService.getTableMetadata(dataSource, tableName);
            List<String> primaryKeys = metadata.getPrimaryKeys();

            if (primaryKeys != null && !primaryKeys.isEmpty()) {
                log.info("Auto-detected primary keys for delete sync: {}", primaryKeys);
                return primaryKeys.toArray(new String[0]);
            }

            if (metadata.isView()) {
                log.info("Source {} is a VIEW with no primary keys, falling back to default identifier columns", tableName);
            }
        } catch (Exception e) {
            log.warn("Failed to auto-detect primary keys, using defaults", e);
        }

        // 优先级 3: 使用默认值
        String[] defaultKeys = {"id", "ID"};
        log.info("Using default primary key columns for delete sync: {}", Arrays.toString(defaultKeys));
        return defaultKeys;
    }

    /**
     * 删除目标表中不在源表主键列表中的记录
     * 使用实体同步表 + LEFT JOIN 实现高效原子删除
     */
    private int deleteOrphanedRecords(DataSource dataSource,
                                      String targetTableName,
                                      String[] primaryKeyColumns,
                                      DataSource sourceDataSource,
                                      String sourceTableName) throws SQLException {

        // 特殊情况：源表为空，清空目标表
        long sourceCount = countRecords(sourceDataSource, sourceTableName);
        if (sourceCount == 0) {
            log.warn("Source table is empty, truncating target table");
            return truncateTargetTable(dataSource, targetTableName);
        }

        String syncTableName = "_sync_" + System.currentTimeMillis();

        try (Connection targetConn = dataSource.getConnection()) {
            targetConn.setAutoCommit(false);

            try {
                // 1. 创建实体同步表
                createSyncTable(targetConn, syncTableName, primaryKeyColumns);

                // 2. 从源表批量导入主键到同步表
                importPrimaryKeysToSyncTable(sourceDataSource, sourceTableName,
                                             targetConn, syncTableName, primaryKeyColumns);

                // 3. 执行一次性删除（LEFT JOIN）
                int deletedCount = deleteUsingLeftJoin(targetConn, targetTableName,
                                                       syncTableName, primaryKeyColumns);

                targetConn.commit();
                log.info("Successfully deleted {} orphaned records using sync table", deletedCount);
                return deletedCount;

            } catch (SQLException e) {
                targetConn.rollback();
                log.error("Failed to delete orphaned records, transaction rolled back", e);
                throw e;
            } finally {
                // 4. 清理实体同步表
                dropSyncTable(targetConn, syncTableName);
                targetConn.setAutoCommit(true);
            }
        }
    }

    /**
     * 创建用于存储主键的实体同步表
     * 使用 InnoDB 引擎确保稳定性，添加主键约束加速 JOIN 操作
     */
    private void createSyncTable(Connection conn, String syncTableName,
                                  String[] primaryKeyColumns) throws SQLException {

        StringBuilder sql = new StringBuilder("CREATE TABLE IF NOT EXISTS ");
        sql.append(syncTableName).append(" (");

        for (int i = 0; i < primaryKeyColumns.length; i++) {
            sql.append(primaryKeyColumns[i]).append(" VARCHAR(255) NOT NULL");
            if (i < primaryKeyColumns.length - 1) {
                sql.append(", ");
            }
        }

        // 复合主键约束
        if (primaryKeyColumns.length > 0) {
            sql.append(", PRIMARY KEY (");
            for (int i = 0; i < primaryKeyColumns.length; i++) {
                sql.append(primaryKeyColumns[i]);
                if (i < primaryKeyColumns.length - 1) {
                    sql.append(", ");
                }
            }
            sql.append(")");
        }

        sql.append(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        log.info("Creating sync table: {}", sql);
        try (Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(sql.toString());
        }
    }

    /**
     * 从源表批量导入主键值到实体同步表
     * 使用 PreparedStatement 批量插入（稳定可靠）
     * 需要 JDBC URL 中配置 rewriteBatchedStatements=true 以获得最佳性能
     */
    private void importPrimaryKeysToSyncTable(DataSource sourceDataSource,
                                               String sourceTableName,
                                               Connection targetConn,
                                               String syncTableName,
                                               String[] primaryKeyColumns) throws SQLException {

        StringBuilder selectSql = new StringBuilder("SELECT ");
        for (int i = 0; i < primaryKeyColumns.length; i++) {
            selectSql.append(primaryKeyColumns[i]);
            if (i < primaryKeyColumns.length - 1) {
                selectSql.append(", ");
            }
        }
        selectSql.append(" FROM ").append(sourceTableName);

        String insertSql = buildInsertSql(syncTableName, primaryKeyColumns);
        log.info("Importing primary keys from source to sync table using batch insert");

        int batchSize = 50000;
        int totalCount = 0;
        long startTime = System.currentTimeMillis();

        try (Connection sourceConn = sourceDataSource.getConnection();
             Statement sourceStmt = sourceConn.createStatement();
             ResultSet rs = sourceStmt.executeQuery(selectSql.toString());
             PreparedStatement pstmt = targetConn.prepareStatement(insertSql)) {

            while (rs.next()) {
                for (int i = 0; i < primaryKeyColumns.length; i++) {
                    pstmt.setObject(i + 1, rs.getObject(i + 1));
                }

                pstmt.addBatch();
                totalCount++;

                if (totalCount % batchSize == 0) {
                    pstmt.executeBatch();
                    long elapsed = System.currentTimeMillis() - startTime;
                    log.debug("Imported {} primary keys to sync table ({} ms)", totalCount, elapsed);
                }
            }

            pstmt.executeBatch();
            long duration = System.currentTimeMillis() - startTime;
            log.info("Total imported {} primary keys to sync table {} in {} ms", totalCount, syncTableName, duration);
        }
    }

    /**
     * 构建 INSERT SQL 语句
     */
    private String buildInsertSql(String tableName, String[] columns) {
        StringBuilder sql = new StringBuilder("INSERT INTO ").append(tableName).append(" (");
        for (int i = 0; i < columns.length; i++) {
            sql.append(columns[i]);
            if (i < columns.length - 1) {
                sql.append(", ");
            }
        }
        sql.append(") VALUES (");
        for (int i = 0; i < columns.length; i++) {
            sql.append("?");
            if (i < columns.length - 1) {
                sql.append(", ");
            }
        }
        sql.append(")");
        return sql.toString();
    }

    String buildInsertSql(String tableName, List<String> columns) {
        return buildInsertSql(tableName, columns.toArray(new String[0]));
    }

    /**
     * 使用 LEFT JOIN 删除孤儿记录
     * 高效且原子化的一次性操作
     */
    private int deleteUsingLeftJoin(Connection conn,
                                     String targetTableName,
                                     String syncTableName,
                                     String[] primaryKeyColumns) throws SQLException {

        StringBuilder sql = new StringBuilder("DELETE t FROM ");
        sql.append(targetTableName).append(" t ");
        sql.append("LEFT JOIN ").append(syncTableName).append(" s ON ");

        // 构建连接条件
        for (int i = 0; i < primaryKeyColumns.length; i++) {
            sql.append("t.").append(primaryKeyColumns[i]);
            sql.append(" = CAST(s.").append(primaryKeyColumns[i]).append(" AS CHAR)");
            if (i < primaryKeyColumns.length - 1) {
                sql.append(" AND ");
            }
        }

        sql.append(" WHERE s.").append(primaryKeyColumns[0]).append(" IS NULL");

        String deleteSql = sql.toString();
        log.info("Executing DELETE with LEFT JOIN: {}", deleteSql);

        try (Statement stmt = conn.createStatement()) {
            long startTime = System.currentTimeMillis();
            int deletedCount = stmt.executeUpdate(deleteSql);
            long duration = System.currentTimeMillis() - startTime;

            log.info("Deleted {} orphaned records in {} ms", deletedCount, duration);
            return deletedCount;
        }
    }

    /**
     * 删除实体同步表
     */
    private void dropSyncTable(Connection conn, String syncTableName) {
        try (Statement stmt = conn.createStatement()) {
            String sql = "DROP TABLE IF EXISTS " + syncTableName;
            stmt.executeUpdate(sql);
            log.info("Dropped sync table: {}", syncTableName);
        } catch (SQLException e) {
            log.warn("Failed to drop sync table {}: {}", syncTableName, e.getMessage());
        }
    }

    /**
     * 统计表的记录数
     */
    private long countRecords(DataSource dataSource, String tableName) throws SQLException {
        String sql = "SELECT COUNT(*) FROM " + tableName;
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                return rs.getLong(1);
            }
            return 0;
        }
    }

    /**
     * 当源表为空时，清空目标表
     */
    private int truncateTargetTable(DataSource dataSource, String tableName) throws SQLException {
        String sql = "DELETE FROM " + tableName;
        log.info("Source table is empty, truncating target table: {}", sql);

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            return stmt.executeUpdate(sql);
        }
    }

    private void incrementalSync(DataSource sourceDataSource, DataSource targetDataSource,
                                String sourceTableName, String targetTableName, List<String> identifierColumns, String identifierExpression,
                                DatabaseSyncConfig.ZhConverterConfig zhConverterConfig) throws SQLException, IllegalAccessException {
        // 0. 同步已删除的记录（目标表有但源表没有的记录）
        syncDeletedRecords(sourceDataSource, targetDataSource, sourceTableName, targetTableName, identifierColumns, identifierExpression);

        // 1. 获取目标表的所有标识符列的最大值
        Map<String, Object> maxIdentifiers = getMaxIdentifiers(targetDataSource, targetTableName, identifierColumns, identifierExpression);
        
        // 2. 从源表获取增量数据
        String incrementalQuery = buildIncrementalQuery(sourceTableName, maxIdentifiers, identifierExpression);
        log.info("Executing SQL: {}", incrementalQuery);
        try (Connection sourceConn = sourceDataSource.getConnection();
             Connection targetConn = targetDataSource.getConnection();
             Statement sourceStmt = sourceConn.createStatement();
             ResultSet rs = sourceStmt.executeQuery(incrementalQuery)) {
            
            ResultSetMetaData metaData = rs.getMetaData();
            SyncColumnMapping columnMapping = resolveSyncColumns(
                    getTargetColumnNames(targetDataSource, targetTableName), metaData, targetTableName);
            int columnCount = columnMapping.size();
            
            // 3. 批量执行upsert操作
            String upsertSQL = buildUpsertSQL(targetTableName, columnMapping.getTargetColumns());
            
            try (PreparedStatement pstmt = targetConn.prepareStatement(upsertSQL)) {
                targetConn.setAutoCommit(false);
                int batchSize = 1000;
                int count = 0;
                
                while (rs.next()) {
                    bindRowValues(pstmt, rs, columnMapping, 1, zhConverterConfig);
                    // 为UPDATE部分设置参数
                    bindRowValues(pstmt, rs, columnMapping, columnCount + 1, zhConverterConfig);
                    
                    // 输出带参数的SQL语句
                    if (count % 100 == 0) { // 每100条记录输出一次，避免日志过多
                        StringBuilder sqlWithParams = new StringBuilder(buildSqlWithParams(upsertSQL, rs, columnMapping, 1, zhConverterConfig));
                        appendSqlParams(sqlWithParams, rs, columnMapping, columnCount + 1, zhConverterConfig);
                        log.debug("Executing SQL: {}", sqlWithParams);
                    }
                    
                    pstmt.addBatch();
                    count++;
                    
                    if (count % batchSize == 0) {
                        pstmt.executeBatch();
                        targetConn.commit();
                        log.debug("Committed batch of {} records", batchSize);
                    }
                }
                
                if (count % batchSize != 0) {
                    pstmt.executeBatch();
                    log.debug("Committed final batch of {} records", count % batchSize);
                }
                
                targetConn.commit();
                log.info("Incremental sync completed: {} records synchronized", count);
            }
        }
    }

    private Map<String, Object> getMaxIdentifiers(DataSource dataSource, String tableName, List<String> configIdentifierColumns, String identifierExpression) throws SQLException {
        Map<String, Object> maxIdentifiers = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection()) {
            // 先尝试使用identifierExpression
            if (identifierExpression != null && !identifierExpression.isEmpty()) {
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT MAX(" + identifierExpression + ") FROM " + tableName)) {
                    if (rs.next() && rs.getObject(1) != null) {
                        maxIdentifiers.put(identifierExpression, rs.getObject(1));
                    }
                } catch (SQLException e) {
                    // 表达式执行失败，继续尝试使用列名
                    log.error("Identifier expression failed: ", e);
                }
                return maxIdentifiers; // 如果使用了表达式，直接返回结果
            }
            
            // 如果没有表达式或表达式执行失败，使用配置的标识符列
            String[] identifierColumns = getIdentifierColumns(configIdentifierColumns);
            for (String column : identifierColumns) {
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT MAX(" + column + ") FROM " + tableName)) {
                    if (rs.next() && rs.getObject(1) != null) {
                        maxIdentifiers.put(column, rs.getObject(1));
                    }
                } catch (SQLException e) {
                    // 该列不存在，继续尝试下一个
                    log.error("getMaxIdentifiers ", e);
                    continue;
                }
            }
        }
        
        // 返回所有找到的标识符列的最大值
        return maxIdentifiers;
    }

    private String[] getIdentifierColumns(List<String> configIdentifierColumns) {
        if (configIdentifierColumns != null && !configIdentifierColumns.isEmpty()) {
            return configIdentifierColumns.toArray(new String[0]);
        }
        // 默认标识符列
        return new String[]{"id", "ID", "uuid", "UUID", "create_time", "createTime", "update_time", "updateTime"};
    }

    private String buildIncrementalQuery(String tableName, Map<String, Object> maxIdentifiers, String identifierExpression) {
        // 优先使用identifierExpression
        if (identifierExpression != null && !identifierExpression.isEmpty() && !maxIdentifiers.isEmpty()) {
            // 获取表达式对应的最大值
            for (Map.Entry<String, Object> entry : maxIdentifiers.entrySet()) {
                if (entry.getKey().equals(identifierExpression)) {
                    Object value = entry.getValue();
                    StringBuilder query = new StringBuilder("SELECT * FROM " + tableName + " WHERE ");
                    
                    // 根据值类型构建查询条件
                    if (value instanceof Number) {
                        query.append(identifierExpression).append(" > ").append(value);
                    } else if (value instanceof Timestamp) {
                        query.append(identifierExpression).append(" > '").append(value).append("'");
                    } else if (value instanceof java.util.Date) {
                        query.append(identifierExpression).append(" > '").append(new Timestamp(((java.util.Date) value).getTime())).append("'");
                    } else {
                        query.append(identifierExpression).append(" > '").append(value).append("'");
                    }
                    
                    return query.toString();
                }
            }
        }
        
        // 如果没有表达式或表达式对应的最大值不存在，使用原来的maxIdentifiers
        if (maxIdentifiers == null || maxIdentifiers.isEmpty()) {
            return "SELECT * FROM " + tableName;
        }
        
        // 构建使用所有标识符列的查询语句
        StringBuilder query = new StringBuilder("SELECT * FROM " + tableName + " WHERE ");
        boolean firstCondition = true;
        
        for (Map.Entry<String, Object> entry : maxIdentifiers.entrySet()) {
            String column = entry.getKey();
            Object value = entry.getValue();
            
            if (!firstCondition) {
                query.append(" OR ");
            }
            
            // 根据标识符类型构建不同的查询条件
            if (value instanceof Number) {
                query.append(column).append(" > ").append(value);
            } else if (value instanceof Timestamp) {
                query.append(column).append(" > '").append(value).append("'");
            } else if (value instanceof java.util.Date) {
                query.append(column).append(" > '").append(new Timestamp(((java.util.Date) value).getTime())).append("'");
            } else {
                query.append(column).append(" > '").append(value).append("'");
            }
            
            firstCondition = false;
        }
        
        return query.toString();
    }

    String buildUpsertSQL(String tableName, List<String> columnNames) {
        // 构建INSERT部分
        StringBuilder insertSQL = new StringBuilder("INSERT INTO " + tableName + " (");
        for (int i = 0; i < columnNames.size(); i++) {
            insertSQL.append(columnNames.get(i));
            if (i < columnNames.size() - 1) {
                insertSQL.append(", ");
            }
        }
        insertSQL.append(") VALUES (");
        for (int i = 0; i < columnNames.size(); i++) {
            insertSQL.append("?");
            if (i < columnNames.size() - 1) {
                insertSQL.append(", ");
            }
        }
        insertSQL.append(")");
        
        // 构建ON DUPLICATE KEY UPDATE部分（MySQL特有的语法）
        insertSQL.append(" ON DUPLICATE KEY UPDATE ");
        for (int i = 0; i < columnNames.size(); i++) {
            insertSQL.append(columnNames.get(i)).append(" = ?");
            if (i < columnNames.size() - 1) {
                insertSQL.append(", ");
            }
        }
        
        String upsertSql = insertSQL.toString();
        log.info("Preparing SQL: {}", upsertSql);
        return upsertSql;
    }

    List<String> getTargetColumnNames(DataSource targetDataSource, String targetTableName) throws SQLException {
        TableMetadata targetMetadata = tableMetadataService.getTableMetadata(targetDataSource, targetTableName);
        List<String> targetColumns = new ArrayList<>();
        for (ColumnMetadata column : targetMetadata.getColumns()) {
            targetColumns.add(column.getColumnName());
        }
        return targetColumns;
    }

    SyncColumnMapping resolveSyncColumns(List<String> targetColumns, ResultSetMetaData metaData, String targetTableName) throws SQLException {
        Map<String, Integer> sourceColumnIndexes = new LinkedHashMap<>();
        int sourceColumnCount = metaData.getColumnCount();
        for (int i = 1; i <= sourceColumnCount; i++) {
            sourceColumnIndexes.putIfAbsent(normalizeColumnName(metaData.getColumnLabel(i)), i);
            sourceColumnIndexes.putIfAbsent(normalizeColumnName(metaData.getColumnName(i)), i);
        }

        List<String> syncColumns = new ArrayList<>();
        List<Integer> sourceIndexes = new ArrayList<>();
        for (String targetColumn : targetColumns) {
            Integer sourceIndex = sourceColumnIndexes.get(normalizeColumnName(targetColumn));
            if (sourceIndex != null) {
                syncColumns.add(targetColumn);
                sourceIndexes.add(sourceIndex);
            }
        }

        if (syncColumns.isEmpty()) {
            throw new SQLException("No common columns found between source result set and target table: " + targetTableName);
        }

        return new SyncColumnMapping(syncColumns, sourceIndexes);
    }

    private void bindRowValues(PreparedStatement pstmt, ResultSet rs, SyncColumnMapping columnMapping,
                               int startParameterIndex,
                               DatabaseSyncConfig.ZhConverterConfig zhConverterConfig) throws SQLException, IllegalAccessException {
        for (int i = 0; i < columnMapping.size(); i++) {
            Object value = getConvertedValue(rs, columnMapping.getSourceIndex(i), zhConverterConfig);
            pstmt.setObject(startParameterIndex + i, value);
        }
    }

    private String buildSqlWithParams(String sql, ResultSet rs, SyncColumnMapping columnMapping,
                                      int startParameterIndex,
                                      DatabaseSyncConfig.ZhConverterConfig zhConverterConfig) throws SQLException, IllegalAccessException {
        StringBuilder sqlWithParams = new StringBuilder(sql);
        appendSqlParams(sqlWithParams, rs, columnMapping, startParameterIndex, zhConverterConfig);
        return sqlWithParams.toString();
    }

    private void appendSqlParams(StringBuilder sqlWithParams, ResultSet rs, SyncColumnMapping columnMapping,
                                 int startParameterIndex,
                                 DatabaseSyncConfig.ZhConverterConfig zhConverterConfig) throws SQLException, IllegalAccessException {
        for (int i = 0; i < columnMapping.size(); i++) {
            Object value = getConvertedValue(rs, columnMapping.getSourceIndex(i), zhConverterConfig);
            String paramValue = value == null ? "NULL" :
                    (value instanceof String ? "'" + value + "'" : value.toString());
            int placeholderIndex = sqlWithParams.indexOf("?", Math.max(0, startParameterIndex - 1));
            if (placeholderIndex >= 0) {
                sqlWithParams.replace(placeholderIndex, placeholderIndex + 1, paramValue);
            }
        }
    }

    private Object getConvertedValue(ResultSet rs, int sourceIndex,
                                     DatabaseSyncConfig.ZhConverterConfig zhConverterConfig) throws SQLException, IllegalAccessException {
        Object value = rs.getObject(sourceIndex);
        if (zhConverterConfig != null && zhConverterConfig.isEnabled() && value instanceof String) {
            return convertString((String) value, zhConverterConfig.getDirection());
        }
        return value;
    }

    private String normalizeColumnName(String columnName) {
        if (columnName == null) {
            return "";
        }
        return columnName.toLowerCase(Locale.ROOT);
    }

    static final class SyncColumnMapping {
        private final List<String> targetColumns;
        private final List<Integer> sourceIndexes;

        SyncColumnMapping(List<String> targetColumns, List<Integer> sourceIndexes) {
            this.targetColumns = targetColumns;
            this.sourceIndexes = sourceIndexes;
        }

        List<String> getTargetColumns() {
            return targetColumns;
        }

        int getSourceIndex(int position) {
            return sourceIndexes.get(position);
        }

        int size() {
            return targetColumns.size();
        }
    }
}
