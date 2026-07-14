package net.dbsync.databasesync.service;

import net.dbsync.databasesync.service.TableMetadataService.ColumnMetadata;
import net.dbsync.databasesync.service.TableMetadataService.TableMetadata;
import lombok.extern.slf4j.Slf4j;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
public class SchemaSynchronizer {

    private final TableMetadataService tableMetadataService = new TableMetadataService();
    private final DataSynchronizer dataSynchronizer = new DataSynchronizer();

    public void synchronizeSchema(DataSource sourceDataSource, DataSource targetDataSource, 
                                 String sourceTableName, String targetTableName) throws SQLException {
        if (!areDatabasesSameType(sourceDataSource, targetDataSource)) {
            log.warn("Source and target database types are different, skip schema synchronization.");
            return;
        }
        
        boolean isMySQLEnabled = isMySQLDatabase(sourceDataSource);
        
        log.info("Retrieving schema for table: {} from source", sourceTableName);
        TableMetadata sourceMetadata = tableMetadataService.getTableMetadata(sourceDataSource, sourceTableName);
        if (sourceMetadata.isView()) {
            log.info("Source object {} is a VIEW, skipping schema synchronization", sourceTableName);
            return;
        }
        log.info("Schema retrieved for table: {} from source", sourceTableName);
        
        log.info("Checking if table: {} exists in target", targetTableName);
        boolean targetTableExists = checkTableExists(targetDataSource, targetTableName);
        log.info("Table {} exists in target: {}", targetTableName, targetTableExists);
        
        if (!targetTableExists) {
            log.info("Table {} does not exist in target, creating it", targetTableName);
            if (isMySQLEnabled) {
                createTableUsingShowCreateTable(sourceDataSource, targetDataSource, sourceTableName, targetTableName);
            } else {
                createTable(targetDataSource, sourceMetadata, targetTableName);
            }
            log.info("Syncing data from {} to {}", sourceTableName, targetTableName);
            try {
                dataSynchronizer.synchronizeData(sourceDataSource, targetDataSource, sourceTableName, targetTableName, "full", null, null, null);
            } catch (Exception e) {
                log.error("Error syncing data: {}", e.getMessage());
                throw new SQLException(e);
            }
        } else {
            log.info("Table {} exists in target, comparing schema", targetTableName);
            TableMetadata targetMetadata = tableMetadataService.getTableMetadata(targetDataSource, targetTableName);
            
            if (isSchemaDifferent(sourceMetadata, targetMetadata)) {
                log.info("Schema differences detected, recreating table and syncing data");
                recreateTableAndSyncData(sourceDataSource, targetDataSource, sourceTableName, targetTableName, sourceMetadata, isMySQLEnabled);
            } else {
                log.info("Table schemas are identical, no changes needed");
            }
        }
        
        verifySyncResult(sourceDataSource, targetDataSource, sourceTableName, targetTableName);
    }
    
    /**
     * 判断数据库是否为MySQL
     */
    private boolean isMySQLDatabase(DataSource dataSource) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            String productName = conn.getMetaData().getDatabaseProductName();
            return productName != null && productName.toLowerCase().contains("mysql");
        }
    }
    
    /**
     * 使用SHOW CREATE TABLE创建表（仅适用于MySQL
     */
    private void createTableUsingShowCreateTable(DataSource sourceDataSource, DataSource targetDataSource, 
                                        String sourceTableName, String targetTableName) throws SQLException {
        try (Connection sourceConn = sourceDataSource.getConnection();
             Connection targetConn = targetDataSource.getConnection();
             Statement sourceStmt = sourceConn.createStatement();
             ResultSet rs = sourceStmt.executeQuery("SHOW CREATE TABLE " + sourceTableName)) {
            if (rs.next()) {
                String createTableSql = rs.getString(2);
                // 替换表名
                createTableSql = createTableSql.replaceFirst("`" + sourceTableName + "`", "`" + targetTableName + "`");
                log.info("Executing SQL from SHOW CREATE TABLE: {}", createTableSql);
                try (Statement targetStmt = targetConn.createStatement()) {
                    targetStmt.executeUpdate(createTableSql);
                }
            }
        }
    }

    private boolean areDatabasesSameType(DataSource sourceDataSource, DataSource targetDataSource) throws SQLException {
        try (Connection sourceConn = sourceDataSource.getConnection();
             Connection targetConn = targetDataSource.getConnection()) {
            String sourceProduct = sourceConn.getMetaData().getDatabaseProductName();
            String targetProduct = targetConn.getMetaData().getDatabaseProductName();
            boolean sameType = sourceProduct != null && targetProduct != null && 
                              sourceProduct.equalsIgnoreCase(targetProduct);
            log.info("Source database: {}, Target database: {}, Same type: {}", 
                     sourceProduct, targetProduct, sameType);
            return sameType;
        }
    }

    private boolean checkTableExists(DataSource dataSource, String tableName) throws SQLException {
        return checkObjectExists(dataSource, tableName, new String[]{"TABLE"});
    }

    private boolean checkObjectExists(DataSource dataSource, String tableName, String[] types) throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            var metaData = connection.getMetaData();
            try (var rs = metaData.getTables(null, null, tableName, types)) {
                return rs.next();
            }
        }
    }

    private boolean isSchemaDifferent(TableMetadata sourceMetadata, TableMetadata targetMetadata) {
        // 比较列数量
        if (sourceMetadata.getColumns().size() != targetMetadata.getColumns().size()) {
            log.info("Column count different: source={}, target={}",
                     sourceMetadata.getColumns().size(), targetMetadata.getColumns().size());
            return true;
        }
        // 创建列信息映射，便于比较
        Map<String, ColumnMetadata> sourceColumns = new HashMap<>();
        for (ColumnMetadata column : sourceMetadata.getColumns()) {
            sourceColumns.put(column.getColumnName(), column);
        }
        
        Map<String, ColumnMetadata> targetColumns = new HashMap<>();
        for (ColumnMetadata column : targetMetadata.getColumns()) {
            targetColumns.put(column.getColumnName(), column);
        }
        
        // 检查目标表中是否有来源表中不存在的列
        for (ColumnMetadata targetColumn : targetMetadata.getColumns()) {
            ColumnMetadata sourceColumn = sourceColumns.get(targetColumn.getColumnName());
            if (sourceColumn == null) {
                log.info("Column {} exists in target but not in source", targetColumn.getColumnName());
                return true;
            }
            
            // 比较类型
            if (!sourceColumn.getTypeName().equals(targetColumn.getTypeName())) {
                log.info("Column {} type different: source={}, target={}", 
                         targetColumn.getColumnName(), sourceColumn.getTypeName(), targetColumn.getTypeName());
                return true;
            }
            
            // 比较长度
            if (sourceColumn.getColumnSize() != targetColumn.getColumnSize()) {
                log.info("Column {} size different: source={}, target={}", 
                         targetColumn.getColumnName(), sourceColumn.getColumnSize(), targetColumn.getColumnSize());
                return true;
            }
            
            // 比较可空性
            if (sourceColumn.isNullable() != targetColumn.isNullable()) {
                log.info("Column {} nullable different: source={}, target={}", 
                         targetColumn.getColumnName(), sourceColumn.isNullable(), targetColumn.isNullable());
                return true;
            }
            
            // 比较默认值
//            if ((sourceColumn.getColumnDef() == null && targetColumn.getColumnDef() != null) ||
//                (sourceColumn.getColumnDef() != null && !sourceColumn.getColumnDef().equals(targetColumn.getColumnDef()))) {
//                log.info("Column {} default value different: source={}, target={}",
//                         targetColumn.getColumnName(), sourceColumn.getColumnDef(), targetColumn.getColumnDef());
//                return true;
//            }
        }
        
        // 检查来源表中是否有目标表中不存在的列（新增字段的情况）
        for (ColumnMetadata sourceColumn : sourceMetadata.getColumns()) {
            ColumnMetadata targetColumn = targetColumns.get(sourceColumn.getColumnName());
            if (targetColumn == null) {
                log.info("Column {} exists in source but not in target (new column)", sourceColumn.getColumnName());
                return true;
            }
        }
        
        // 比较主键
        if (sourceMetadata.getPrimaryKeys().size() != targetMetadata.getPrimaryKeys().size()) {
            log.info("Primary key count different: source={}, target={}", 
                     sourceMetadata.getPrimaryKeys().size(), targetMetadata.getPrimaryKeys().size());
            return true;
        }
        
        for (String pk : sourceMetadata.getPrimaryKeys()) {
            if (!targetMetadata.getPrimaryKeys().contains(pk)) {
                log.info("Primary key {} exists in source but not in target", pk);
                return true;
            }
        }
        
        return false;
    }

    private void recreateTableAndSyncData(DataSource sourceDataSource, DataSource targetDataSource, 
                                         String sourceTableName, String targetTableName, 
                                         TableMetadata sourceMetadata, boolean isMySQLEnabled) throws SQLException {
        try (Connection targetConn = targetDataSource.getConnection()) {
            targetConn.setAutoCommit(false);
            
            try {
                log.info("Dropping table {} in target", targetTableName);
                try (Statement stmt = targetConn.createStatement()) {
                    stmt.executeUpdate("DROP TABLE IF EXISTS " + targetTableName);
                    log.info("Dropped target table {}", targetTableName);
                }
                
                log.info("Creating table {} in target", targetTableName);
                if (isMySQLEnabled) {
                    try (Connection sourceConn = sourceDataSource.getConnection();
                         Statement sourceStmt = sourceConn.createStatement();
                         ResultSet rs = sourceStmt.executeQuery("SHOW CREATE TABLE " + sourceTableName)) {
                        if (rs.next()) {
                            String createTableSql = rs.getString(2);
                            createTableSql = createTableSql.replaceFirst("`" + sourceTableName + "`", "`" + targetTableName + "`");
                            log.info("Executing SQL from SHOW CREATE TABLE: {}", createTableSql);
                            try (Statement targetStmt = targetConn.createStatement()) {
                                targetStmt.executeUpdate(createTableSql);
                            }
                        }
                    }
                } else {
                    createTableWithConnection(targetConn, sourceMetadata, targetTableName);
                }
                
                targetConn.commit();
                log.info("Table {} recreated successfully", targetTableName);
                
                log.info("Syncing data from {} to {}", sourceTableName, targetTableName);
                try {
                    dataSynchronizer.synchronizeData(sourceDataSource, targetDataSource, sourceTableName, targetTableName, "full", null, null, null);
                } catch (Exception e) {
                    log.error("Error syncing data: {}", e.getMessage());
                    throw new SQLException(e);
                }
                
            } catch (SQLException e) {
                targetConn.rollback();
                log.error("Error during table recreation: {}", e.getMessage());
                throw e;
            } finally {
                targetConn.setAutoCommit(true);
            }
        }
    }

    private void createTable(DataSource dataSource, TableMetadata sourceMetadata, String targetTableName) throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            createTableWithConnection(connection, sourceMetadata, targetTableName);
        }
    }

    private void createTableWithConnection(Connection connection, TableMetadata sourceMetadata, String targetTableName) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            StringBuilder createTableSQL = new StringBuilder("CREATE TABLE " + targetTableName + " (");
            
            List<ColumnMetadata> columns = sourceMetadata.getColumns();
            List<String> primaryKeys = sourceMetadata.getPrimaryKeys();
            
            for (int i = 0; i < columns.size(); i++) {
                ColumnMetadata column = columns.get(i);
                createTableSQL.append(column.getColumnName())
                        .append(" ")
                        .append(column.getTypeName());
                
                // 根据数据类型判断是否设置长度
                if (shouldIncludeLength(column.getTypeName()) && column.getColumnSize() > 0) {
                    createTableSQL.append("(")
                            .append(column.getColumnSize());
                    
                    // 对于小数类型，添加小数点后长度
                    if (isDecimalType(column.getTypeName()) && column.getDecimalDigits() > 0) {
                        createTableSQL.append(", ")
                                .append(column.getDecimalDigits());
                    }
                    
                    createTableSQL.append(")");
                }
                
                if (!column.isNullable()) {
                    createTableSQL.append(" NOT NULL");
                }
                
//                if (column.getColumnDef() != null) {
//                    createTableSQL.append(" DEFAULT '")
//                            .append(column.getColumnDef()).append("'");
//                }
                
                // 添加字段注释
                if (column.getColumnComment() != null && !column.getColumnComment().isEmpty()) {
                    // 转义单引号
                    String comment = column.getColumnComment().replace("'", "''");
                    createTableSQL.append(" COMMENT '").append(comment).append("'");
                }
                
                if (i < columns.size() - 1) {
                    createTableSQL.append(", ");
                }
            }
            
            if (!primaryKeys.isEmpty()) {
                createTableSQL.append(", PRIMARY KEY (");
                for (int i = 0; i < primaryKeys.size(); i++) {
                    createTableSQL.append(primaryKeys.get(i));
                    if (i < primaryKeys.size() - 1) {
                        createTableSQL.append(", ");
                    }
                }
                createTableSQL.append(")");
            }
            
            // 添加表注释
            if (sourceMetadata.getTableComment() != null && !sourceMetadata.getTableComment().isEmpty()) {
                // 转义单引号
                String tableComment = sourceMetadata.getTableComment().replace("'", "''");
                createTableSQL.append(" COMMENT '").append(tableComment).append("'");
            }
            
            createTableSQL.append(")");
            
            String sql = createTableSQL.toString();
            log.info("Executing SQL: {}", sql);
            statement.executeUpdate(sql);
        }
    }

    private void verifySyncResult(DataSource sourceDataSource, DataSource targetDataSource, 
                                 String sourceTableName, String targetTableName) throws SQLException {
        // 验证表结构
        log.info("Verifying table structure consistency");
        TableMetadata sourceMetadata = tableMetadataService.getTableMetadata(sourceDataSource, sourceTableName);
        TableMetadata targetMetadata = tableMetadataService.getTableMetadata(targetDataSource, targetTableName);
        
        if (!isSchemaDifferent(sourceMetadata, targetMetadata)) {
            log.info("Table structure verification passed");
        } else {
            log.warn("Table structure verification failed");
        }
        
        // 验证数据记录数
        log.info("Verifying data record count");
        int sourceCount = getRowCount(sourceDataSource, sourceTableName);
        int targetCount = getRowCount(targetDataSource, targetTableName);
        
        log.info("Source table {} has {} records", sourceTableName, sourceCount);
        log.info("Target table {} has {} records", targetTableName, targetCount);
        
        if (sourceCount == targetCount) {
            log.info("Data record count verification passed");
        } else {
            log.warn("Data record count verification failed: source={}, target={}", sourceCount, targetCount);
        }
    }

    private int getRowCount(DataSource dataSource, String tableName) throws SQLException {
        String countSql = "SELECT COUNT(*) FROM " + tableName;
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet rs = statement.executeQuery(countSql)) {
            if (rs.next()) {
                return rs.getInt(1);
            }
            return 0;
        }
    }
    
    /**
     * 判断数据类型是否需要设置长度
     * @param typeName 数据类型名称
     * @return 是否需要设置长度
     */
    private boolean shouldIncludeLength(String typeName) {
        // 不需要长度的常见数据类型
        String[] noLengthTypes = {
            "INT", "INTEGER", "BIGINT", "SMALLINT", "TINYINT", 
            "DATE", "TIME", "DATETIME", "TIMESTAMP",
            "BOOLEAN", "BIT",
            "TEXT", "LONGTEXT", "CLOB",
            "BLOB", "LONGBLOB"
        };
        
        for (String type : noLengthTypes) {
            if (typeName.equalsIgnoreCase(type)) {
                return false;
            }
        }
        
        // 需要长度的常见数据类型
        String[] lengthTypes = {
            "VARCHAR", "CHAR", "NVARCHAR", "NCHAR",
            "VARBINARY", "BINARY",
            "DECIMAL", "NUMERIC"
        };
        
        for (String type : lengthTypes) {
            if (typeName.equalsIgnoreCase(type)) {
                return true;
            }
        }
        
        // 默认情况下，只有当列大小大于0时才包含长度
        return false;
    }
    
    /**
     * 判断数据类型是否为小数类型
     * @param typeName 数据类型名称
     * @return 是否为小数类型
     */
    private boolean isDecimalType(String typeName) {
        String[] decimalTypes = {
            "FLOAT", "DOUBLE", "DECIMAL", "NUMERIC"
        };
        
        for (String type : decimalTypes) {
            if (typeName.equalsIgnoreCase(type)) {
                return true;
            }
        }
        
        return false;
    }
}
