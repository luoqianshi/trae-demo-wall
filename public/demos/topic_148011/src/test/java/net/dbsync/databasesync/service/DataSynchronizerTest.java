package net.dbsync.databasesync.service;

import org.junit.jupiter.api.Test;

import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DataSynchronizerTest {

    private final DataSynchronizer dataSynchronizer = new DataSynchronizer();

    @Test
    void resolveSyncColumnsUsesTargetOrderAndIntersection() throws SQLException {
        ResultSetMetaData metaData = mockMetaData("name", "extra_col", "ID");

        DataSynchronizer.SyncColumnMapping mapping = dataSynchronizer.resolveSyncColumns(
                List.of("id", "name", "status"), metaData, "target_table");

        assertEquals(List.of("id", "name"), mapping.getTargetColumns());
        assertEquals(3, mapping.getSourceIndex(0));
        assertEquals(1, mapping.getSourceIndex(1));
        assertEquals(2, mapping.size());
    }

    @Test
    void resolveSyncColumnsThrowsWhenNoCommonColumns() throws SQLException {
        ResultSetMetaData metaData = mockMetaData("source_only", "other_col");

        SQLException exception = assertThrows(SQLException.class,
                () -> dataSynchronizer.resolveSyncColumns(List.of("id", "name"), metaData, "target_table"));

        assertEquals("No common columns found between source result set and target table: target_table",
                exception.getMessage());
    }

    @Test
    void buildSqlUsesOnlyResolvedColumns() throws SQLException {
        ResultSetMetaData metaData = mockMetaData("name", "ignored_col", "id");

        DataSynchronizer.SyncColumnMapping mapping = dataSynchronizer.resolveSyncColumns(
                List.of("id", "name", "status"), metaData, "target_table");

        assertEquals("INSERT INTO target_table (id, name) VALUES (?, ?)",
                dataSynchronizer.buildInsertSql("target_table", mapping.getTargetColumns()));
        assertEquals("INSERT INTO target_table (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = ?, name = ?",
                dataSynchronizer.buildUpsertSQL("target_table", mapping.getTargetColumns()));
    }

    private ResultSetMetaData mockMetaData(String... columnNames) throws SQLException {
        ResultSetMetaData metaData = mock(ResultSetMetaData.class);
        when(metaData.getColumnCount()).thenReturn(columnNames.length);
        for (int i = 0; i < columnNames.length; i++) {
            when(metaData.getColumnLabel(i + 1)).thenReturn(columnNames[i]);
            when(metaData.getColumnName(i + 1)).thenReturn(columnNames[i]);
        }
        return metaData;
    }
}
