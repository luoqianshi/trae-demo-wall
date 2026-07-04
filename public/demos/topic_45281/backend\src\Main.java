import java.util.concurrent.CountDownLatch;
import util.HttpServerUtil;
import util.JDBCUtil;

public class Main {
    public static void main(String[] args) {
        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.println("║       医院信息管理系统 (HIS)  v2.0          ║");
        System.out.println("║   Hospital Information System               ║");
        System.out.println("╚══════════════════════════════════════════════╝\n");

        System.out.print("[Init] 正在连接数据库... ");
        if (!JDBCUtil.testConnection()) {
            System.out.println("失败");
            System.out.println("\n请确保:");
            System.out.println("  1. MySQL数据库已安装并启动");
            System.out.println("  2. 已执行 hospital.sql 创建数据库和表");
            System.out.println("  3. 检查 config.properties 中的数据库连接信息");
            System.out.println("\n按 Ctrl+C 退出...");
            return;
        }
        System.out.println("成功 (连接池: " + JDBCUtil.getPoolSize() + " 连接)");

        try {
            HttpServerUtil.startServer();
        } catch (Exception e) {
            System.out.println("[Error] 服务器启动失败: " + e.getMessage());
            return;
        }

        System.out.println("\n══════════════════════════════════════════════");
        System.out.println("  后端API地址: http://localhost:" + util.AppConfig.getServerPort() + "/api/");
        System.out.println("  健康检查:    http://localhost:" + util.AppConfig.getServerPort() + "/api/patients");
        System.out.println("  系统已就绪，按 Ctrl+C 停止...");
        System.out.println("══════════════════════════════════════════════\n");

        CountDownLatch shutdownLatch = new CountDownLatch(1);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n[Shutdown] 正在关闭服务器...");
            HttpServerUtil.stopServer();
            JDBCUtil.shutdown();
            System.out.println("[Shutdown] 服务器已安全关闭");
            shutdownLatch.countDown();
        }));

        try {
            shutdownLatch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
