import util.JDBCUtil;

public class TestDB {
    public static void main(String[] args) {
        System.out.println("测试数据库连接...");
        JDBCUtil.testConnection();
    }
}
