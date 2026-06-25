package util;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

public class JDBCUtil {
    private static final String URL = AppConfig.getDbUrl();
    private static final String USER = AppConfig.getDbUser();
    private static final String PASSWORD = AppConfig.getDbPassword();
    private static final String DRIVER = "com.mysql.jdbc.Driver";
    private static final int POOL_SIZE = AppConfig.getDbPoolSize();
    private static BlockingQueue<Connection> connectionPool;
    private static int activeConnections = 0;

    static {
        try {
            Class.forName(DRIVER);
            connectionPool = new LinkedBlockingQueue<>(POOL_SIZE);
            for (int i = 0; i < POOL_SIZE; i++) {
                try {
                    connectionPool.offer(DriverManager.getConnection(URL, USER, PASSWORD));
                } catch (SQLException e) {
                    System.out.println("[JDBC] Failed to create connection " + i + ": " + e.getMessage());
                }
            }
            System.out.println("[JDBC] Connection pool initialized with " + connectionPool.size() + " connections");
        } catch (ClassNotFoundException e) {
            System.out.println("错误: 未找到MySQL JDBC驱动!");
            System.exit(1);
        }
    }

    private static Connection createNewConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    public static Connection getConnection() throws SQLException {
        try {
            Connection conn = connectionPool.poll(5, TimeUnit.SECONDS);
            if (conn == null) {
                throw new SQLException("获取数据库连接超时，连接池已满");
            }
            if (conn.isClosed() || !conn.isValid(3)) {
                try { conn.close(); } catch (SQLException ignored) {}
                conn = createNewConnection();
            }
            synchronized (JDBCUtil.class) {
                activeConnections++;
            }
            return conn;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SQLException("获取连接被中断");
        }
    }

    public static void close(Connection conn, Statement stmt, ResultSet rs) {
        if (rs != null) {
            try { rs.close(); } catch (SQLException e) { e.printStackTrace(); }
        }
        if (stmt != null) {
            try { stmt.close(); } catch (SQLException e) { e.printStackTrace(); }
        }
        if (conn != null) {
            synchronized (JDBCUtil.class) {
                activeConnections--;
            }
            try {
                if (!conn.isClosed()) {
                    if (!conn.getAutoCommit()) {
                        conn.setAutoCommit(true);
                    }
                    connectionPool.offer(conn);
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    public static void close(Connection conn, Statement stmt) {
        close(conn, stmt, null);
    }

    public static int executeUpdate(String sql, Object... params) {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = getConnection();
            pstmt = conn.prepareStatement(sql);
            for (int i = 0; i < params.length; i++) {
                pstmt.setObject(i + 1, params[i]);
            }
            return pstmt.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        } finally {
            close(conn, pstmt);
        }
    }

    public static int executeInsert(String sql, Object... params) {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = getConnection();
            pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < params.length; i++) {
                pstmt.setObject(i + 1, params[i]);
            }
            pstmt.executeUpdate();
            rs = pstmt.getGeneratedKeys();
            if (rs.next()) {
                return rs.getInt(1);
            }
            return -1;
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        } finally {
            close(conn, pstmt, rs);
        }
    }

    public static QueryResult executeQuery(String sql, Object... params) {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = getConnection();
            pstmt = conn.prepareStatement(sql);
            for (int i = 0; i < params.length; i++) {
                pstmt.setObject(i + 1, params[i]);
            }
            rs = pstmt.executeQuery();
            return new QueryResult(conn, pstmt, rs);
        } catch (SQLException e) {
            e.printStackTrace();
            close(conn, pstmt, rs);
            return null;
        }
    }

    public static Connection beginTransaction() throws SQLException {
        Connection conn = getConnection();
        conn.setAutoCommit(false);
        return conn;
    }

    public static void commit(Connection conn) {
        if (conn != null) {
            try {
                conn.commit();
                conn.setAutoCommit(true);
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                close(conn, null);
            }
        }
    }

    public static void rollback(Connection conn) {
        if (conn != null) {
            try {
                conn.rollback();
                conn.setAutoCommit(true);
            } catch (SQLException e) {
                e.printStackTrace();
            } finally {
                close(conn, null);
            }
        }
    }

    public static int executeUpdate(Connection conn, String sql, Object... params) throws SQLException {
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                pstmt.setObject(i + 1, params[i]);
            }
            return pstmt.executeUpdate();
        }
    }

    public static int executeInsert(Connection conn, String sql, Object... params) throws SQLException {
        try (PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            for (int i = 0; i < params.length; i++) {
                pstmt.setObject(i + 1, params[i]);
            }
            pstmt.executeUpdate();
            try (ResultSet rs = pstmt.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
            return -1;
        }
    }

    public static int[] executeBatch(String sql, List<Object[]> batchParams) {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = getConnection();
            conn.setAutoCommit(false);
            pstmt = conn.prepareStatement(sql);
            for (Object[] params : batchParams) {
                for (int i = 0; i < params.length; i++) {
                    pstmt.setObject(i + 1, params[i]);
                }
                pstmt.addBatch();
            }
            int[] results = pstmt.executeBatch();
            conn.commit();
            return results;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            e.printStackTrace();
            return new int[0];
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); } catch (SQLException e) { e.printStackTrace(); }
            }
            close(conn, pstmt);
        }
    }

    public static boolean testConnection() {
        try {
            Connection conn = getConnection();
            if (conn != null && !conn.isClosed()) {
                close(conn, null);
                return true;
            }
        } catch (SQLException e) {
            System.out.println("数据库连接失败: " + e.getMessage());
        }
        return false;
    }

    public static void shutdown() {
        Connection conn;
        while ((conn = connectionPool.poll()) != null) {
            try { conn.close(); } catch (SQLException e) { e.printStackTrace(); }
        }
        System.out.println("数据库连接池已关闭");
    }

    public static int getPoolSize() {
        return connectionPool.size();
    }

    public static int getActiveConnections() {
        return activeConnections;
    }

    public static class QueryResult implements AutoCloseable {
        private final Connection conn;
        private final PreparedStatement pstmt;
        private final ResultSet rs;

        public QueryResult(Connection conn, PreparedStatement pstmt, ResultSet rs) {
            this.conn = conn;
            this.pstmt = pstmt;
            this.rs = rs;
        }

        public ResultSet getResultSet() {
            return rs;
        }

        @Override
        public void close() {
            JDBCUtil.close(conn, pstmt, rs);
        }
    }
}

