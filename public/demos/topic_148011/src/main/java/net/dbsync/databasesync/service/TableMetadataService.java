package net.dbsync.databasesync.service;

import lombok.Data;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class TableMetadataService {

    public TableMetadata getTableMetadata(DataSource dataSource, String tableName) throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            TableMetadata tableMetadata = new TableMetadata();
            tableMetadata.setTableName(tableName);
            String catalog = connection.getCatalog();
            
            // 获取表注释
            ResultSet tableRs = metaData.getTables(catalog, "", tableName, new String[]{"TABLE", "VIEW"});
            if (tableRs.next()) {
                tableMetadata.setTableComment(tableRs.getString("REMARKS"));
                tableMetadata.setTableType(tableRs.getString("TABLE_TYPE"));
            }
            
            // 获取表列信息
            List<ColumnMetadata> columns = new ArrayList<>();
            ResultSet rs = metaData.getColumns(catalog, "", tableName, null);
            while (rs.next()) {
                ColumnMetadata column = new ColumnMetadata();
                column.setColumnName(rs.getString("COLUMN_NAME"));
                column.setDataType(rs.getInt("DATA_TYPE"));
                column.setTypeName(rs.getString("TYPE_NAME"));
                column.setColumnSize(rs.getInt("COLUMN_SIZE"));
                column.setDecimalDigits(rs.getInt("DECIMAL_DIGITS"));
                column.setNullable(rs.getInt("NULLABLE") == 1);
                column.setColumnDef(rs.getString("COLUMN_DEF"));
                column.setColumnComment(rs.getString("REMARKS"));
                columns.add(column);
            }
            tableMetadata.setColumns(columns);
            
            // 获取主键信息
            List<String> primaryKeys = new ArrayList<>();
            ResultSet pkRs = metaData.getPrimaryKeys(catalog, null, tableName);
            while (pkRs.next()) {
                primaryKeys.add(pkRs.getString("COLUMN_NAME"));
            }
            tableMetadata.setPrimaryKeys(primaryKeys);
            
            return tableMetadata;
        }
    }

    @Data
    public static class TableMetadata {
        private String tableName;
        private String tableType;
        private String tableComment;
        private List<ColumnMetadata> columns;
        private List<String> primaryKeys;

        public boolean isView() {
            return "VIEW".equalsIgnoreCase(tableType);
        }
    }

    @Data
    public static class ColumnMetadata {
        private String columnName;
        private int dataType;
        private String typeName;
        private int columnSize;
        private int decimalDigits;
        private boolean nullable;
        private String columnDef;
        private String columnComment;
    }
}
