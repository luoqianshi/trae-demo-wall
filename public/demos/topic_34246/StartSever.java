import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.awt.Desktop;
import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.file.Files;
import java.util.Arrays;

class MusicServer {
    private static final int PORT = 26333;        // 服务器端口
    private static final String WEB_ROOT = ".";  // 静态资源根目录
    private static final String MUSIC_FOLDER = "Music"; // 音乐文件夹

    public static void main(String[] args) throws Exception {
        // 1️⃣ 生成 musicList.json
        generateMusicList();

        // 2️⃣ 启动 HTTP 服务器
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        System.out.println("服务器已启动：http://127.0.0.1:" + PORT);

        server.createContext("/", new StaticFileHandler());
        server.setExecutor(null); // 默认线程池
        server.start();

        // 3️⃣ 打开默认浏览器访问主页面
        try {
            String url = "http://127.0.0.1:" + PORT + "/MainStart.html";
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(new URI(url));
            }
        } catch (Exception e) {
            System.out.println("自动打开浏览器失败，请手动访问：http://127.0.0.1:" + PORT + "/MainStart.html");
        }
    }

    /** 生成 musicList.json */
    private static void generateMusicList() {
        File folder = new File(MUSIC_FOLDER);
        if(!folder.exists() || !folder.isDirectory()) {
            System.out.println("音乐文件夹不存在：" + MUSIC_FOLDER);
            return;
        }

        String[] musicFiles = folder.list((dir, name) -> name.toLowerCase().endsWith(".mp3"));
        if(musicFiles == null || musicFiles.length == 0){
            System.out.println("音乐文件夹为空！");
            return;
        }

        Arrays.sort(musicFiles);

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < musicFiles.length; i++) {
            json.append("\"").append(musicFiles[i].replace("\"","")).append("\"");
            if (i != musicFiles.length - 1) json.append(",");
        }
        json.append("]");

        try (FileWriter writer = new FileWriter(MUSIC_FOLDER + "/musicList.json")) {
            writer.write(json.toString());
            System.out.println("已生成 musicList.json：" + json.toString());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /** 静态文件处理器 */
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) path = "/MainStart.html"; // 默认首页

            File file = new File(WEB_ROOT, path);
            if (!file.exists() || file.isDirectory()) {
                String response = "404 Not Found";
                exchange.sendResponseHeaders(404, response.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(response.getBytes());
                }
                return;
            }

            String contentType = Files.probeContentType(file.toPath());
            if (contentType == null) contentType = "application/octet-stream";
            exchange.getResponseHeaders().set("Content-Type", contentType);

            byte[] data = Files.readAllBytes(file.toPath());
            exchange.sendResponseHeaders(200, data.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(data);
            }
        }
    }
}
