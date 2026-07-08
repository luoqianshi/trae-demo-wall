package site;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.URLDecoder;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class App {
    static final int PORT = 8080;
    static final Path ROOT = Paths.get("").toAbsolutePath();
    static final Path DATA_DIR = ROOT.resolve("data");
    static final Path UPLOAD_DIR = ROOT.resolve("uploads");
    static final Path CONFIG_FILE = ROOT.resolve("config").resolve("app.properties");
    static final Path PERSON_DB = DATA_DIR.resolve("persons.db");
    static final Path ACCOUNT_DB = DATA_DIR.resolve("accounts.db");
    static final long PHOTO_MAX = 20L * 1024 * 1024;
    static final long DOC_MAX = 5L * 1024 * 1024;
    static final Charset UTF8 = StandardCharsets.UTF_8;
    static final Map<String, SessionUser> sessions = new ConcurrentHashMap<String, SessionUser>();
    static Store store;

    public static void main(String[] args) throws Exception {
        Files.createDirectories(DATA_DIR);
        Files.createDirectories(UPLOAD_DIR);
        store = new Store();
        store.load();
        startAgeScheduler();
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/", new Router());
        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
        System.out.println("人员身份卡及工作牌管理系统已启动: http://localhost:" + PORT + "/login");
        System.out.println("数据目录: " + DATA_DIR);
        System.out.println("上传目录: " + UPLOAD_DIR);
    }

    static void startAgeScheduler() {
        ScheduledExecutorService ses = Executors.newSingleThreadScheduledExecutor();
        ses.scheduleAtFixedRate(new Runnable() {
            public void run() {
                LocalDate now = LocalDate.now();
                if (now.getMonthValue() == 1 && now.getDayOfMonth() == 1) {
                    store.incrementAgeOncePerYear(now.getYear());
                }
            }
        }, 5, 24 * 60 * 60, TimeUnit.SECONDS);
    }

    static class Router implements HttpHandler {
        public void handle(HttpExchange ex) throws IOException {
            try {
                String path = ex.getRequestURI().getPath();
                String method = ex.getRequestMethod();
                if (path.startsWith("/uploads/")) { sendUpload(ex, path); return; }
                if (path.equals("/")) { redirect(ex, currentUser(ex) == null ? "/login" : "/persons"); return; }
                if (path.equals("/login") && method.equals("GET")) { loginPage(ex, ""); return; }
                if (path.equals("/login") && method.equals("POST")) { doLogin(ex); return; }
                if (path.equals("/logout")) { doLogout(ex); return; }
                if (path.equals("/card")) { publicCard(ex); return; }
                if (path.equals("/api/face/verify") && method.equals("POST")) { faceVerify(ex); return; }

                SessionUser user = currentUser(ex);
                if (user == null) { redirect(ex, "/login?error=" + enc("请先登录后再访问后台页面")); return; }
                if (path.equals("/persons") && method.equals("GET")) { personList(ex, user); return; }
                if (path.equals("/persons/new") && method.equals("GET")) { personForm(ex, user, null, ""); return; }
                if (path.equals("/persons/new") && method.equals("POST")) { savePerson(ex, user, null); return; }
                if (path.equals("/persons/edit") && method.equals("GET")) { editForm(ex, user); return; }
                if (path.equals("/persons/edit") && method.equals("POST")) { savePerson(ex, user, query(ex).get("id")); return; }
                if (path.equals("/persons/delete") && method.equals("POST")) { deletePerson(ex, user); return; }
                if (path.equals("/qr") && method.equals("GET")) { qrPage(ex, user); return; }
                if (path.equals("/qr/download") && method.equals("GET")) { qrDownload(ex, user); return; }
                if (path.equals("/qr/batch") && method.equals("GET")) { qrBatch(ex, user); return; }
                if (path.equals("/accounts") && method.equals("GET")) { accountsPage(ex, user, ""); return; }
                if (path.equals("/accounts/new") && method.equals("POST")) { accountNew(ex, user); return; }
                html(ex, 404, layout(user, "未找到", "<div class='card'><h2>页面不存在</h2></div>"));
            } catch (Exception e) {
                e.printStackTrace();
                html(ex, 500, "<!doctype html><meta charset='utf-8'><h2>系统错误</h2><pre>" + esc(e.getMessage()) + "</pre>");
            }
        }
    }

    static void loginPage(HttpExchange ex, String forced) throws IOException {
        Map<String, String> q = query(ex);
        String msg = forced.length() > 0 ? forced : q.getOrDefault("error", "");
        String ok = q.getOrDefault("ok", "");
        String body = "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
                "<title>登录 - 人员身份卡及工作牌管理系统</title>" + css() + "</head><body class='login-body'>" +
                "<main class='login-shell'><section class='login-card'><div class='brand-mark'>ID</div><h1>人员身份卡及工作牌管理系统</h1>" +
                "<p>施工现场人员资料、二维码工作牌和扫码核验一体管理</p>" +
                (msg.length() > 0 ? "<div class='alert danger'>" + esc(msg) + "</div>" : "") +
                (ok.length() > 0 ? "<div class='alert ok'>" + esc(ok) + "</div>" : "") +
                "<form method='post' action='/login'><label>账号<input name='username' required autofocus></label>" +
                "<label>密码<input name='password' type='password' required></label><button class='primary full'>登录</button></form>" +
                "<div class='hint'>默认管理员：admin / admin123<br>默认内业员：neiye / neiye123</div></section></main></body></html>";
        html(ex, 200, body);
    }

    static void doLogin(HttpExchange ex) throws IOException {
        Map<String, String> form = parseUrlEncoded(readBytes(ex));
        Account a = store.accounts.get(form.get("username"));
        if (a == null || !a.password.equals(form.get("password"))) {
            redirect(ex, "/login?error=" + enc("账号或密码错误"));
            return;
        }
        String sid = UUID.randomUUID().toString().replace("-", "");
        sessions.put(sid, new SessionUser(a.username, a.role));
        ex.getResponseHeaders().add("Set-Cookie", "SESSION=" + sid + "; Path=/; HttpOnly");
        redirect(ex, "/persons?msg=" + enc("登录成功"));
    }

    static void doLogout(HttpExchange ex) throws IOException {
        String sid = cookie(ex, "SESSION");
        if (sid != null) sessions.remove(sid);
        ex.getResponseHeaders().add("Set-Cookie", "SESSION=; Path=/; Max-Age=0; HttpOnly");
        redirect(ex, "/login?ok=" + enc("已退出登录"));
    }

    static void personList(HttpExchange ex, SessionUser user) throws IOException {
        Map<String, String> q = query(ex);
        String kw = lower(q.get("kw")), area = q.getOrDefault("area", ""), job = q.getOrDefault("job", ""), sort = q.getOrDefault("sort", "createdDesc");
        List<Person> list = new ArrayList<Person>();
        Set<String> areas = new TreeSet<String>(), jobs = new TreeSet<String>();
        for (Person p : store.persons) {
            if (!canAccess(user, p)) continue;
            areas.add(nvl(p.workArea)); jobs.add(nvl(p.job));
            if (kw.length() > 0 && !(lower(p.name).contains(kw) || lower(p.job).contains(kw) || lower(p.company).contains(kw) || lower(p.workArea).contains(kw))) continue;
            if (area.length() > 0 && !area.equals(p.workArea)) continue;
            if (job.length() > 0 && !job.equals(p.job)) continue;
            list.add(p);
        }
        Collections.sort(list, comparator(sort));
        StringBuilder sb = new StringBuilder();
        sb.append("<div class='page-head'><div><h1>人员列表</h1><p>当前账号：").append(esc(user.username)).append("（").append(user.isAdmin() ? "管理员" : "内业员").append("）</p></div><div><a class='btn primary' href='/persons/new'>新增人员</a> <a class='btn' href='/qr/batch'>批量下载二维码</a></div></div>");
        if (q.containsKey("msg")) sb.append("<div class='alert ok'>").append(esc(q.get("msg"))).append("</div>");
        sb.append("<form class='filters' method='get'><input name='kw' placeholder='搜索姓名、岗位、公司、工区' value='").append(attr(q.get("kw"))).append("'>");
        sb.append("<select name='area'><option value=''>全部工区</option>").append(options(areas, area)).append("</select>");
        sb.append("<select name='job'><option value=''>全部岗位</option>").append(options(jobs, job)).append("</select>");
        sb.append("<select name='sort'><option value='createdDesc'").append(sel(sort,"createdDesc")).append(">创建日期倒序</option><option value='name'").append(sel(sort,"name")).append(">姓名排序</option><option value='ageDesc'").append(sel(sort,"ageDesc")).append(">年龄倒序</option><option value='insurance'").append(sel(sort,"insurance")).append(">保险有效期</option></select><button class='btn'>筛选</button></form>");
        sb.append("<div class='card table-wrap'><table><thead><tr><th>姓名</th><th>岗位</th><th>公司/工区</th><th>保险预警</th><th>执业资格预警</th><th>创建人</th><th>操作</th></tr></thead><tbody>");
        if (list.isEmpty()) sb.append("<tr><td colspan='7' class='empty'>暂无人员数据</td></tr>");
        for (Person p : list) {
            sb.append("<tr><td><strong>").append(esc(p.name)).append("</strong><div class='sub'>").append(esc(p.gender)).append(" / ").append(p.age).append("岁</div></td>");
            sb.append("<td>").append(esc(p.job)).append("</td><td>").append(esc(p.company)).append("<div class='sub'>").append(esc(p.workArea)).append("</div></td>");
            sb.append("<td>").append(warnBadge(p.insuranceExpiry)).append("<div class='sub'>").append(esc(p.insuranceExpiry)).append("</div></td><td>").append(qualificationWarnings(p)).append("</td><td>").append(esc(p.creator)).append("<div class='sub'>").append(esc(p.createdDate)).append("</div></td>");
            sb.append("<td class='ops'><a href='/persons/edit?id=").append(enc(p.id)).append("'>编辑</a><a href='/qr?id=").append(enc(p.id)).append("'>二维码</a><a href='/qr/download?id=").append(enc(p.id)).append("'>下载</a><form method='post' action='/persons/delete' onsubmit=\"return confirm('确认删除该人员？')\"><input type='hidden' name='id' value='").append(attr(p.id)).append("'><button>删除</button></form></td></tr>");
        }
        sb.append("</tbody></table></div>");
        html(ex, 200, layout(user, "人员列表", sb.toString()));
    }

    static void editForm(HttpExchange ex, SessionUser user) throws IOException {
        Person p = store.find(query(ex).get("id"));
        if (p == null || !canAccess(user, p)) { html(ex, 403, layout(user, "无权访问", "<div class='card'><h2>无权访问或人员不存在</h2></div>")); return; }
        personForm(ex, user, p, "");
    }

    static void personForm(HttpExchange ex, SessionUser user, Person p, String error) throws IOException {
        boolean edit = p != null;
        if (p == null) p = new Person();
        StringBuilder sb = new StringBuilder();
        sb.append("<div class='page-head'><div><h1>").append(edit ? "编辑人员" : "新增人员").append("</h1><p>带 * 的项目必须填写，图片保存后可通过 URL 访问。</p></div><a class='btn' href='/persons'>返回列表</a></div>");
        if (error.length() > 0) sb.append("<div class='alert danger'>").append(esc(error)).append("</div>");
        sb.append("<form id='personForm' class='person-form' method='post' enctype='multipart/form-data' onsubmit='return validatePersonForm(").append(edit ? "true" : "false").append(")'>");
        sb.append("<section class='card'><h2>基本信息</h2><div class='grid'>")
                .append(input("姓名 *","name",p.name,"最多 5 个汉字"))
                .append(select("性别 *","gender",p.gender,new String[]{"男","女"}))
                .append(input("年龄 *","age",p.age==0?"":String.valueOf(p.age),"16-65"))
                .append(input("民族","nation",p.nation,"如：汉族"))
                .append(input("政治面貌","politicalStatus",p.politicalStatus,"群众/党员等"))
                .append(input("岗位 *","job",p.job,"如：安全员"))
                .append(input("所在工区 *","workArea",p.workArea,""))
                .append(input("所在公司 *","company",p.company,""))
                .append("</div><label>人员照片 ").append(edit ? "" : "*").append("<input id='photoFile' type='file' name='photo' accept='image/*'>").append(imageLinks(single(p.photoPath))).append("</label></section>");
        sb.append("<section class='card'><h2>保险信息</h2><div class='grid'>").append(input("保险有效期","insuranceExpiry",p.insuranceExpiry,"yyyy-MM-dd", "date")).append("</div><label>保险资料图片 *（最多 20 张，单张 5MB）<input id='insuranceFiles' type='file' name='insuranceImages' multiple accept='image/*'>").append(imageLinks(p.insuranceImages)).append("</label></section>");
        sb.append("<section class='card'><div class='section-head'><h2>执业资格</h2><button type='button' class='btn' onclick='addQualification()'>增加执业资格</button></div><p class='sub'>默认 0 项，最多 5 项；填写名称后必须上传 1-3 张证书图片并填写有效期。</p><div id='qualificationBox'>");
        for (int i = 0; i < p.qualifications.size(); i++) sb.append(qualificationBlock(i, p.qualifications.get(i)));
        sb.append("</div></section>");
        sb.append("<section class='card'><h2>技术职称和学历</h2><div class='grid'>")
                .append(input("技术职称","technicalTitle",p.technicalTitle,""))
                .append(input("技术职称专业","technicalTitleMajor",p.technicalTitleMajor,"选择技术职称后必填"))
                .append(input("最高学历","highestEducation",p.highestEducation,""))
                .append(input("最高学位","highestDegree",p.highestDegree,""))
                .append(input("毕业院校","graduateSchool",p.graduateSchool,""))
                .append(input("所学专业","major",p.major,""))
                .append(input("毕业时间","graduationDate",p.graduationDate,"yyyy-MM-dd","date"))
                .append(input("进场时间","entryDate",p.entryDate,"yyyy-MM-dd","date"))
                .append("</div></section>");
        sb.append("<section class='card'><h2>安全培训考试</h2><div class='grid'>").append(input("安全考试成绩 *","safetyScore",p.safetyScore==0?"":String.valueOf(p.safetyScore),"60-100")).append("</div>");
        sb.append("<label>安全责任书图片<input type='file' name='responsibilityImages' multiple accept='image/*'>").append(imageLinks(p.responsibilityImages)).append("</label>");
        sb.append("<label>安全培训图片<input type='file' name='trainingImages' multiple accept='image/*'>").append(imageLinks(p.trainingImages)).append("</label>");
        sb.append("<label>考试资料图片<input type='file' name='examImages' multiple accept='image/*'>").append(imageLinks(p.examImages)).append("</label></section>");
        sb.append("<input type='hidden' id='qualificationIndexes' name='qualificationIndexes'><div class='sticky-actions'><button class='primary'>保存</button><a class='btn' href='/persons'>取消</a></div></form>");
        sb.append(formScript(p.qualifications.size()));
        html(ex, 200, layout(user, edit ? "编辑人员" : "新增人员", sb.toString()));
    }

    static void savePerson(HttpExchange ex, SessionUser user, String editId) throws IOException {
        MultipartForm mf = MultipartForm.parse(ex);
        Person old = editId == null ? null : store.find(editId);
        if (editId != null && (old == null || !canAccess(user, old))) { html(ex, 403, layout(user, "无权访问", "<div class='card'>无权编辑该人员</div>")); return; }
        Person p = old == null ? new Person() : old.copy();
        boolean isNew = old == null;
        if (isNew) {
            p.id = UUID.randomUUID().toString();
            p.creator = user.username;
            p.createdDate = LocalDate.now().toString();
        }
        try {
            fillAndValidatePerson(p, mf, isNew);
            if (isNew) store.persons.add(p); else store.replace(p);
            store.savePersons();
            redirect(ex, "/persons?msg=" + enc(isNew ? "新增人员保存成功" : "人员信息更新成功"));
        } catch (ValidationException ve) {
            personForm(ex, user, isNew ? null : old, ve.getMessage());
        }
    }

    static void fillAndValidatePerson(Person p, MultipartForm mf, boolean isNew) throws IOException, ValidationException {
        p.name = trim(mf.v("name")); p.gender = trim(mf.v("gender")); p.age = parseInt(mf.v("age"));
        p.nation = trim(mf.v("nation")); p.politicalStatus = trim(mf.v("politicalStatus")); p.job = trim(mf.v("job"));
        p.workArea = trim(mf.v("workArea")); p.company = trim(mf.v("company")); p.insuranceExpiry = trim(mf.v("insuranceExpiry"));
        p.technicalTitle = trim(mf.v("technicalTitle")); p.technicalTitleMajor = trim(mf.v("technicalTitleMajor"));
        p.highestEducation = trim(mf.v("highestEducation")); p.highestDegree = trim(mf.v("highestDegree")); p.graduateSchool = trim(mf.v("graduateSchool"));
        p.major = trim(mf.v("major")); p.graduationDate = trim(mf.v("graduationDate")); p.entryDate = trim(mf.v("entryDate")); p.safetyScore = parseInt(mf.v("safetyScore"));
        if (!p.name.matches("[\\u4e00-\\u9fa5]{1,5}")) throw new ValidationException("姓名必须为 1 到 5 个汉字");
        if (p.gender.length()==0 || p.job.length()==0 || p.workArea.length()==0 || p.company.length()==0) throw new ValidationException("性别、岗位、工区、公司均为必填项");
        if (p.job.length() > 30) throw new ValidationException("岗位长度不能超过 30 个字符");
        if (p.age < 16 || p.age > 65) throw new ValidationException("年龄必须在 16 到 65 岁之间");
        if (p.safetyScore < 60 || p.safetyScore > 100) throw new ValidationException("安全考试成绩必须在 60 到 100 分之间");
        if (p.technicalTitle.length() > 0 && p.technicalTitleMajor.length() == 0) throw new ValidationException("选择技术职称后必须填写技术职称专业");
        Part photo = mf.firstFile("photo");
        if (photo != null) p.photoPath = saveImage(photo, "person-photo", PHOTO_MAX);
        if (isNew && nvl(p.photoPath).length() == 0) throw new ValidationException("新增人员必须上传人员照片");
        List<String> insuranceNew = saveImages(mf.files("insuranceImages"), "insurance", DOC_MAX, 20);
        p.insuranceImages.addAll(insuranceNew);
        if (p.insuranceImages.isEmpty()) throw new ValidationException("必须上传至少 1 张保险图片");
        if (p.insuranceImages.size() > 20) throw new ValidationException("保险图片最多支持 20 张");
        p.responsibilityImages.addAll(saveImages(mf.files("responsibilityImages"), "safety", DOC_MAX, 50));
        p.trainingImages.addAll(saveImages(mf.files("trainingImages"), "safety", DOC_MAX, 50));
        p.examImages.addAll(saveImages(mf.files("examImages"), "safety", DOC_MAX, 50));
        p.qualifications = parseQualifications(mf);
    }

    static List<Qualification> parseQualifications(MultipartForm mf) throws IOException, ValidationException {
        List<Qualification> out = new ArrayList<Qualification>();
        String indexes = mf.v("qualificationIndexes");
        if (indexes == null || indexes.trim().length() == 0) return out;
        for (String idx : indexes.split(",")) {
            if (idx.trim().length() == 0) continue;
            String name = trim(mf.v("qualificationName" + idx));
            String expiry = trim(mf.v("qualificationExpiry" + idx));
            List<String> existing = splitPaths(mf.v("qualificationExisting" + idx));
            List<String> added = saveImages(mf.files("qualificationCert" + idx), "qualification", DOC_MAX, 3);
            List<String> certs = new ArrayList<String>(); certs.addAll(existing); certs.addAll(added);
            if (name.length() == 0 && expiry.length() == 0 && certs.isEmpty()) continue;
            if (name.length() == 0) throw new ValidationException("执业资格名称不能为空");
            if (expiry.length() == 0) throw new ValidationException("执业资格“" + name + "”必须填写有效期");
            if (certs.size() < 1 || certs.size() > 3) throw new ValidationException("执业资格“" + name + "”证书图片必须为 1 到 3 张");
            if (out.size() >= 5) throw new ValidationException("最多允许保存 5 个执业资格");
            Qualification q = new Qualification(); q.name = name; q.expiryDate = expiry; q.certificateImages = certs; out.add(q);
        }
        return out;
    }

    static void deletePerson(HttpExchange ex, SessionUser user) throws IOException {
        Map<String, String> form = parseUrlEncoded(readBytes(ex));
        Person p = store.find(form.get("id"));
        if (p == null || !canAccess(user, p)) { redirect(ex, "/persons?msg=" + enc("无权删除或人员不存在")); return; }
        store.persons.remove(p);
        store.savePersons();
        redirect(ex, "/persons?msg=" + enc("删除成功"));
    }

    static void qrPage(HttpExchange ex, SessionUser user) throws IOException {
        Person p = store.find(query(ex).get("id"));
        if (p == null || !canAccess(user, p)) { html(ex, 404, layout(user, "二维码", "<div class='card'>人员不存在或无权访问</div>")); return; }
        String scanUrl = baseUrl(ex) + "/card?id=" + p.id;
        String body = "<div class='page-head'><h1>二维码工作牌</h1><a class='btn' href='/persons'>返回列表</a></div><div class='card qr-card'><img src='/qr/download?id=" + attr(p.id) + "'><p>二维码实际扫码地址：<a href='" + attr(scanUrl) + "' target='_blank'>" + esc(scanUrl) + "</a></p><p class='sub'>如果手机打不开，请确认手机能访问这个 IP，酒店 WiFi 可能会隔离设备。</p><a class='btn primary' href='/qr/download?id=" + attr(p.id) + "'>下载 PNG</a></div>";
        html(ex, 200, layout(user, "二维码", body));
    }

    static void qrDownload(HttpExchange ex, SessionUser user) throws IOException {
        Person p = store.find(query(ex).get("id"));
        if (p == null || !canAccess(user, p)) { text(ex, 404, "人员不存在或无权访问"); return; }
        byte[] png = BadgeImage.make(p, baseUrl(ex) + "/card?id=" + p.id);
        download(ex, "image/png", safeFile(p.name + "-" + p.job + ".png"), png);
    }

    static void qrBatch(HttpExchange ex, SessionUser user) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ZipOutputStream zos = new ZipOutputStream(bos);
        for (Person p : store.persons) {
            if (!canAccess(user, p)) continue;
            zos.putNextEntry(new ZipEntry(safeFile(p.name + "-" + p.job + "-" + p.id.substring(0, 6) + ".png")));
            zos.write(BadgeImage.make(p, baseUrl(ex) + "/card?id=" + p.id));
            zos.closeEntry();
        }
        zos.close();
        download(ex, "application/zip", "人员二维码批量下载.zip", bos.toByteArray());
    }

    static void publicCard(HttpExchange ex) throws IOException {
        Person p = store.find(query(ex).get("id"));
        if (p == null) {
            String body = "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" + css() + "</head><body><main class='mobile'><div class='card center'><h2>人员不存在或二维码已失效</h2><p>请联系项目部核实。</p></div></main></body></html>";
            html(ex, 200, body); return;
        }
        StringBuilder sb = new StringBuilder();
        sb.append("<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1'><title>").append(esc(p.name)).append(" 身份卡</title>").append(css()).append("</head><body><main class='mobile'>");
        sb.append("<section class='mobile-hero'><div class='avatar' onclick='triggerFaceCapture()'>").append(p.photoPath.length()>0?"<img src='/uploads/"+attr(p.photoPath)+"' onerror=\"this.parentNode.innerHTML='照片'\">":"照片").append("</div><h1>").append(esc(p.name)).append("</h1><p>").append(esc(p.job)).append(" · ").append(esc(p.company)).append("</p><span>").append(esc(p.workArea)).append("</span></section>");
        sb.append("<section class='card'><h2>基础信息</h2><div class='info-grid'>").append(info("性别",p.gender)).append(info("年龄",String.valueOf(p.age))).append(info("民族",p.nation)).append(info("政治面貌",p.politicalStatus)).append(info("进场时间",p.entryDate)).append("</div></section>");
        sb.append("<section class='card'><h2>保险信息 ").append(warnBadge(p.insuranceExpiry)).append("</h2><p>有效期：").append(esc(p.insuranceExpiry)).append("</p>").append(imageLinksPublic(p.insuranceImages)).append("</section>");
        sb.append("<section class='card'><h2>安全培训考试</h2><p>安全考试成绩：").append(p.safetyScore).append("</p><h3>安全责任书</h3>").append(imageLinksPublic(p.responsibilityImages)).append("<h3>安全培训</h3>").append(imageLinksPublic(p.trainingImages)).append("<h3>考试资料</h3>").append(imageLinksPublic(p.examImages)).append("</section>");
        sb.append("<section class='card'><h2>技术职称和学历</h2><div class='info-grid'>").append(info("技术职称",p.technicalTitle)).append(info("职称专业",p.technicalTitleMajor)).append(info("最高学历",p.highestEducation)).append(info("最高学位",p.highestDegree)).append(info("毕业院校",p.graduateSchool)).append(info("所学专业",p.major)).append(info("毕业时间",p.graduationDate)).append("</div></section>");
        sb.append("<section class='card'><h2>执业资格</h2>");
        if (p.qualifications.isEmpty()) sb.append("<p class='sub'>暂无执业资格</p>");
        for (Qualification q : p.qualifications) sb.append("<div class='qual-view'><h3>").append(esc(q.name)).append(" ").append(warnBadge(q.expiryDate)).append("</h3><p>有效期：").append(esc(q.expiryDate)).append("</p>").append(imageLinksPublic(q.certificateImages)).append("</div>");
        sb.append("</section><section class='card'><h2>人脸识别核验</h2><p class='sub'>微信或普通手机浏览器可直接调起拍照。点击顶部头像也会直接进入拍照识别流程。</p><button class='primary full' onclick='triggerFaceCapture()'>微信拍照识别</button><input id='faceInput' type='file' accept='image/*' capture='environment' style='display:none'><div id='faceStatus' class='face-status'>等待拍照识别</div></section>");
        sb.append("<div id='previewMask' class='preview-mask' onclick='this.style.display=\"none\"'><img id='previewImg'></div>");
        sb.append("<script>var PERSON_ID='").append(js(p.id)).append("';function triggerFaceCapture(){document.getElementById('faceInput').click();}document.getElementById('faceInput').addEventListener('change',function(){var f=this.files[0];if(!f)return;var s=document.getElementById('faceStatus');s.className='face-status';s.innerHTML='正在识别...';var fd=new FormData();fd.append('personId',PERSON_ID);fd.append('photo',f);fetch('/api/face/verify',{method:'POST',body:fd}).then(r=>r.json()).then(function(d){s.className='face-status '+(d.matched?'pass':'fail');s.innerHTML=d.message+'，分数 '+d.score+'，阈值 '+d.threshold;}).catch(function(){s.className='face-status fail';s.innerHTML='上传失败，请重试';});});function preview(src){document.getElementById('previewImg').src=src;document.getElementById('previewMask').style.display='flex';}</script>");
        sb.append("</main></body></html>");
        html(ex, 200, sb.toString());
    }

    static void faceVerify(HttpExchange ex) throws IOException {
        try {
            MultipartForm mf = MultipartForm.parse(ex);
            Person p = store.find(mf.v("personId"));
            Part live = mf.firstFile("photo");
            if (p == null) { json(ex, "{\"success\":false,\"matched\":false,\"score\":0,\"threshold\":0.66,\"message\":\"人员不存在或二维码已失效\"}"); return; }
            if (live == null) { json(ex, "{\"success\":false,\"matched\":false,\"score\":0,\"threshold\":0.66,\"message\":\"未收到现场照片\"}"); return; }
            Path original = UPLOAD_DIR.resolve(p.photoPath).normalize();
            double score = FaceRecognition.score(Files.readAllBytes(original), live.data);
            boolean matched = score >= FaceRecognition.THRESHOLD;
            json(ex, "{\"success\":true,\"matched\":" + matched + ",\"score\":" + fmt(score) + ",\"threshold\":" + FaceRecognition.THRESHOLD + ",\"message\":\"" + (matched ? "识别通过" : "识别不通过") + "\"}");
        } catch (Exception e) {
            json(ex, "{\"success\":false,\"matched\":false,\"score\":0,\"threshold\":0.66,\"message\":\"识别失败：" + js(e.getMessage()) + "\"}");
        }
    }

    static void accountsPage(HttpExchange ex, SessionUser user, String error) throws IOException {
        if (!user.isAdmin()) { html(ex, 403, layout(user, "无权访问", "<div class='card'>只有管理员可以管理账号</div>")); return; }
        StringBuilder sb = new StringBuilder("<div class='page-head'><h1>账号管理</h1><a class='btn' href='/persons'>返回列表</a></div>");
        if (error.length()>0) sb.append("<div class='alert danger'>").append(esc(error)).append("</div>");
        sb.append("<div class='card'><h2>新增内业员账号</h2><form class='filters' method='post' action='/accounts/new'><input name='username' placeholder='账号' required><input name='password' placeholder='密码' required><button class='primary'>新增</button></form></div><div class='card'><h2>已有账号</h2><table><tr><th>账号</th><th>角色</th></tr>");
        for (Account a : store.accounts.values()) sb.append("<tr><td>").append(esc(a.username)).append("</td><td>").append(esc(a.role)).append("</td></tr>");
        sb.append("</table></div>");
        html(ex, 200, layout(user, "账号管理", sb.toString()));
    }

    static void accountNew(HttpExchange ex, SessionUser user) throws IOException {
        if (!user.isAdmin()) { html(ex, 403, layout(user, "无权访问", "<div class='card'>只有管理员可以新增账号</div>")); return; }
        Map<String, String> form = parseUrlEncoded(readBytes(ex));
        String u = trim(form.get("username")), p = trim(form.get("password"));
        if (!u.matches("[A-Za-z0-9_]{3,20}") || p.length() < 6) { accountsPage(ex, user, "账号需为 3-20 位字母数字下划线，密码至少 6 位"); return; }
        if (store.accounts.containsKey(u)) { accountsPage(ex, user, "账号已存在"); return; }
        store.accounts.put(u, new Account(u, p, "NEIYE"));
        store.saveAccounts();
        redirect(ex, "/accounts");
    }

    static String layout(SessionUser user, String title, String content) {
        String nav = user == null ? "" : "<header class='topbar'><a class='logo' href='/persons'>工作牌管理</a><nav><a href='/persons'>人员列表</a>" + (user.isAdmin() ? "<a href='/accounts'>账号管理</a>" : "") + "<a href='/logout'>退出登录</a></nav></header>";
        return "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>" + esc(title) + "</title>" + css() + "</head><body>" + nav + "<main class='container'>" + content + "</main></body></html>";
    }

    static String css() {
        return "<style>" +
                "*{box-sizing:border-box}body{margin:0;background:#f3f5f8;color:#162033;font-family:'Microsoft YaHei','PingFang SC',sans-serif}a{color:#173f8a;text-decoration:none}.topbar{height:64px;background:#14284a;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 32px;box-shadow:0 8px 24px #0b1b3329}.logo{color:#fff;font-weight:800;letter-spacing:2px}.topbar nav a{color:#e8eefc;margin-left:22px}.container{max-width:1180px;margin:28px auto;padding:0 18px}.page-head{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:18px}.page-head h1{margin:0 0 6px;font-size:26px}.page-head p,.sub,.hint{color:#657084;font-size:13px}.card{background:#fff;border:1px solid #e3e8ef;border-radius:18px;padding:20px;margin-bottom:18px;box-shadow:0 12px 36px #1d2b4410}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.person-form label,.login-card label{display:block;font-weight:700;color:#2b3650;margin-bottom:14px}.person-form input,.person-form select,.filters input,.filters select,.login-card input{width:100%;padding:12px;border:1px solid #cfd7e3;border-radius:10px;margin-top:6px;background:#fff}.btn,button{display:inline-flex;align-items:center;justify-content:center;border:1px solid #cbd5e1;border-radius:10px;padding:9px 13px;background:#fff;color:#14284a;cursor:pointer;font-weight:700}.primary{background:#f28c28!important;border-color:#f28c28!important;color:white!important}.full{width:100%;padding:13px}.danger{background:#fff1f0;color:#a51c16;border:1px solid #ffc8c3}.ok{background:#eefaf1;color:#0e6b2e;border:1px solid #bde8c8}.alert{padding:12px 14px;border-radius:12px;margin:14px 0}.filters{display:flex;gap:10px;align-items:end;margin-bottom:16px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:13px;border-bottom:1px solid #e8edf3;text-align:left;vertical-align:top}th{background:#f7f9fc;color:#4d5b72}.empty{text-align:center;color:#7a8496;padding:40px}.ops{display:flex;gap:8px;flex-wrap:wrap}.ops form{display:inline}.ops button{padding:0;border:0;background:none;color:#b42318}.badge{display:inline-block;border-radius:999px;padding:3px 9px;font-size:12px;font-weight:800}.badge.ok{background:#e8f7ee;color:#177245;border:0}.badge.warn{background:#fff4db;color:#9b5c00;border:0}.badge.expired{background:#ffe8e5;color:#b42318;border:0}.section-head{display:flex;justify-content:space-between;align-items:center}.qual-block{border:1px dashed #cbd5e1;border-radius:14px;padding:14px;margin-top:12px;background:#fbfcff}.sticky-actions{position:sticky;bottom:0;background:#fffffff2;border:1px solid #e4e9f0;border-radius:16px;padding:14px;margin-bottom:20px;display:flex;gap:10px}.thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.thumbs img{width:76px;height:76px;object-fit:cover;border-radius:10px;border:1px solid #dce3ed}.login-body{min-height:100vh;background:linear-gradient(135deg,#14284a,#1e4c7b 55%,#f28c28);display:grid;place-items:center}.login-shell{width:min(440px,92vw)}.login-card{background:#fffffff2;border-radius:24px;padding:32px;box-shadow:0 25px 70px #07152d66}.brand-mark{width:56px;height:56px;border-radius:18px;background:#f28c28;color:#fff;display:grid;place-items:center;font-weight:900}.qr-card{text-align:center}.qr-card img{max-width:360px;width:100%;border:1px solid #e0e6ef}.mobile{max-width:520px;margin:0 auto;padding:12px;background:#eef2f7;min-height:100vh}.mobile-hero{background:#14284a;color:#fff;border-radius:0 0 26px 26px;text-align:center;padding:26px 16px;margin:-12px -12px 16px}.avatar{width:132px;height:132px;border-radius:24px;background:#dce3ed;color:#506176;margin:0 auto 14px;display:grid;place-items:center;overflow:hidden;border:4px solid #fff;cursor:pointer}.avatar img{width:100%;height:100%;object-fit:cover}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.info{background:#f7f9fc;border-radius:12px;padding:10px}.info b{display:block;color:#657084;font-size:12px}.gallery img{width:88px;height:88px;object-fit:cover;border-radius:12px;margin:5px;border:1px solid #d7dfeb}.preview-mask{display:none;position:fixed;inset:0;background:#000b;align-items:center;justify-content:center;z-index:10}.preview-mask img{max-width:94vw;max-height:90vh}.face-status{margin-top:12px;padding:12px;border-radius:12px;background:#f1f5f9}.face-status.pass{background:#e8f7ee;color:#136c3a}.face-status.fail{background:#ffe8e5;color:#a51c16}@media(max-width:760px){.grid,.info-grid{grid-template-columns:1fr}.filters,.page-head{flex-direction:column;align-items:stretch}.topbar{padding:0 14px}.container{margin:16px auto}.ops{display:block}.ops a,.ops form{margin-right:8px}}" +
                "</style>";
    }

    static String formScript(int next) {
        return "<script>var qualNext=" + next + ";function fileOk(file,max,msg){if(!file)return true;if(!file.type.startsWith('image/')){alert(msg+'必须是图片类型');return false;}if(file.size>max){alert(msg+'超过大小限制');return false;}return true;}function validatePersonForm(edit){var f=document.getElementById('personForm');var name=f.name.value.trim();if(!/^[\\u4e00-\\u9fa5]{1,5}$/.test(name)){alert('姓名必须为 1 到 5 个汉字');return false;}var age=parseInt(f.age.value,10);if(isNaN(age)||age<16||age>65){alert('年龄必须在 16 到 65 岁之间');return false;}if(age>60){alert('提示：该人员年龄已超过 60 岁，请确认是否符合进场要求。');}var score=parseInt(f.safetyScore.value,10);if(isNaN(score)||score<60||score>100){alert('安全考试成绩必须在 60 到 100 分之间');return false;}if(f.technicalTitle.value.trim()&& !f.technicalTitleMajor.value.trim()){alert('选择技术职称后必须填写技术职称专业');return false;}var photo=document.getElementById('photoFile');if(!edit&&photo.files.length===0){alert('新增人员必须上传人员照片');return false;}if(photo.files[0]&&!fileOk(photo.files[0],20*1024*1024,'人员照片'))return false;var ins=document.getElementById('insuranceFiles');if(!edit&&ins.files.length===0){alert('新增人员必须上传至少 1 张保险图片');return false;}if(ins.files.length>20){alert('保险图片最多 20 张');return false;}var all=document.querySelectorAll('input[type=file]');for(var i=0;i<all.length;i++){if(all[i].id==='photoFile')continue;for(var j=0;j<all[i].files.length;j++){if(!fileOk(all[i].files[j],5*1024*1024,'证件图片'))return false;}}var indexes=[];var blocks=document.querySelectorAll('.qual-block');for(var b=0;b<blocks.length;b++){var block=blocks[b];var idx=block.dataset.idx;indexes.push(idx);var nm=block.querySelector('[name=qualificationName'+idx+']').value.trim();var exp=block.querySelector('[name=qualificationExpiry'+idx+']').value.trim();var ex=block.querySelector('[name=qualificationExisting'+idx+']').value.trim();var files=block.querySelector('[name=qualificationCert'+idx+']').files.length;var count=(ex?ex.split(',').filter(Boolean).length:0)+files;if(nm&&(exp===''||count<1||count>3)){alert('执业资格填写名称后，必须填写有效期并提供 1 到 3 张证书图片');return false;}}document.getElementById('qualificationIndexes').value=indexes.join(',');return true;}function addQualification(){var box=document.getElementById('qualificationBox');if(box.children.length>=5){alert('最多允许 5 个执业资格');return;}var i=qualNext++;var div=document.createElement('div');div.className='qual-block';div.dataset.idx=i;div.innerHTML='<input type=\"hidden\" name=\"qualificationExisting'+i+'\"><div class=\"grid\"><label>执业资格名称<input name=\"qualificationName'+i+'\"></label><label>有效期<input type=\"date\" name=\"qualificationExpiry'+i+'\"></label></div><label>证书图片（1-3 张）<input type=\"file\" name=\"qualificationCert'+i+'\" multiple accept=\"image/*\"></label><button type=\"button\" onclick=\"this.closest(\\'.qual-block\\').remove()\">删除</button>';box.appendChild(div);}</script>";
    }

    static String qualificationBlock(int i, Qualification q) {
        return "<div class='qual-block' data-idx='" + i + "'><input type='hidden' name='qualificationExisting" + i + "' value='" + attr(join(q.certificateImages)) + "'><div class='grid'><label>执业资格名称<input name='qualificationName" + i + "' value='" + attr(q.name) + "'></label><label>有效期<input type='date' name='qualificationExpiry" + i + "' value='" + attr(q.expiryDate) + "'></label></div><label>证书图片（1-3 张）<input type='file' name='qualificationCert" + i + "' multiple accept='image/*'>" + imageLinks(q.certificateImages) + "</label><button type='button' onclick=\"this.closest('.qual-block').remove()\">删除</button></div>";
    }

    static String input(String label, String name, String value, String ph) { return input(label, name, value, ph, "text"); }
    static String input(String label, String name, String value, String ph, String type) { return "<label>" + label + "<input type='" + type + "' name='" + name + "' value='" + attr(value) + "' placeholder='" + attr(ph) + "'></label>"; }
    static String select(String label, String name, String value, String[] opts) { StringBuilder sb = new StringBuilder("<label>"+label+"<select name='"+name+"'>"); for(String o:opts) sb.append("<option value='").append(attr(o)).append("'").append(sel(value,o)).append(">").append(esc(o)).append("</option>"); return sb.append("</select></label>").toString(); }
    static String info(String k, String v) { return "<div class='info'><b>"+esc(k)+"</b><span>"+esc(nvl(v))+"</span></div>"; }
    static String imageLinks(List<String> paths) { if(paths==null||paths.isEmpty()) return ""; StringBuilder sb=new StringBuilder("<div class='thumbs'>"); for(String p:paths) sb.append("<a target='_blank' href='/uploads/").append(attr(p)).append("'><img src='/uploads/").append(attr(p)).append("'></a>"); return sb.append("</div>").toString(); }
    static String imageLinksPublic(List<String> paths) { if(paths==null||paths.isEmpty()) return "<p class='sub'>暂无图片</p>"; StringBuilder sb=new StringBuilder("<div class='gallery'>"); for(String p:paths) sb.append("<img onclick=\"preview('/uploads/").append(attr(p)).append("')\" src='/uploads/").append(attr(p)).append("'>"); return sb.append("</div>").toString(); }

    static String warnBadge(String date) {
        String s = expiryStatus(date);
        if ("已过期".equals(s)) return "<span class='badge expired'>已过期</span>";
        if ("即将到期".equals(s)) return "<span class='badge warn'>即将到期</span>";
        return "<span class='badge ok'>正常</span>";
    }
    static String qualificationWarnings(Person p) { if(p.qualifications.isEmpty()) return "<span class='sub'>无</span>"; StringBuilder sb=new StringBuilder(); for(Qualification q:p.qualifications) sb.append("<div>").append(esc(q.name)).append(" ").append(warnBadge(q.expiryDate)).append("<div class='sub'>").append(esc(q.expiryDate)).append("</div></div>"); return sb.toString(); }
    static String expiryStatus(String date) { try { if(date==null||date.length()==0) return "正常"; long days= ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(date)); if(days<0)return"已过期"; if(days<30)return"即将到期"; return"正常"; } catch(Exception e){ return "正常"; } }

    static String saveImage(Part part, String dir, long max) throws IOException, ValidationException {
        if (part == null || part.data.length == 0) return "";
        if (part.data.length > max) throw new ValidationException(("person-photo".equals(dir) ? "人员照片" : "证件图片") + "超过大小限制");
        BufferedImage img = ImageIO.read(new ByteArrayInputStream(part.data));
        if (img == null) throw new ValidationException("上传文件必须是图片类型");
        Path folder = UPLOAD_DIR.resolve(dir); Files.createDirectories(folder);
        String ext = imageExt(part.contentType, part.filename);
        String name = System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10) + "." + ext;
        Files.write(folder.resolve(name), part.data);
        return dir + "/" + name;
    }
    static List<String> saveImages(List<Part> parts, String dir, long max, int limit) throws IOException, ValidationException { List<String> out=new ArrayList<String>(); for(Part p:parts) if(p.data.length>0) out.add(saveImage(p,dir,max)); if(out.size()>limit) throw new ValidationException("上传图片数量超过限制"); return out; }
    static String imageExt(String ct, String fn) { String f=lower(fn); if(f.endsWith(".jpg")||f.endsWith(".jpeg"))return"jpg"; if(f.endsWith(".gif"))return"gif"; if(f.endsWith(".bmp"))return"bmp"; return"png"; }

    static Comparator<Person> comparator(String sort) {
        if ("name".equals(sort)) return new Comparator<Person>() { public int compare(Person a, Person b) { return nvl(a.name).compareTo(nvl(b.name)); } };
        if ("ageDesc".equals(sort)) return new Comparator<Person>() { public int compare(Person a, Person b) { return b.age - a.age; } };
        if ("insurance".equals(sort)) return new Comparator<Person>() { public int compare(Person a, Person b) { return nvl(a.insuranceExpiry).compareTo(nvl(b.insuranceExpiry)); } };
        return new Comparator<Person>() { public int compare(Person a, Person b) { return nvl(b.createdDate).compareTo(nvl(a.createdDate)); } };
    }

    static boolean canAccess(SessionUser u, Person p) { return u != null && (u.isAdmin() || u.username.equals(p.creator)); }
    static SessionUser currentUser(HttpExchange ex) { String sid = cookie(ex, "SESSION"); return sid == null ? null : sessions.get(sid); }
    static String cookie(HttpExchange ex, String name) { List<String> cs=ex.getRequestHeaders().get("Cookie"); if(cs==null)return null; for(String c:cs) for(String x:c.split(";")) { String[] kv=x.trim().split("=",2); if(kv.length==2&&kv[0].equals(name))return kv[1]; } return null; }
    static Map<String, String> query(HttpExchange ex) { return parseQuery(ex.getRequestURI().getRawQuery()); }
    static Map<String, String> parseQuery(String raw) { Map<String,String> m=new LinkedHashMap<String,String>(); if(raw==null)return m; for(String p:raw.split("&")){String[] kv=p.split("=",2); if(kv.length>0)m.put(dec(kv[0]),kv.length>1?dec(kv[1]):"");} return m; }
    static Map<String, String> parseUrlEncoded(byte[] b) { return parseQuery(new String(b, UTF8)); }
    static byte[] readBytes(HttpExchange ex) throws IOException { ByteArrayOutputStream bos=new ByteArrayOutputStream(); byte[] buf=new byte[8192]; int n; InputStream in=ex.getRequestBody(); while((n=in.read(buf))!=-1)bos.write(buf,0,n); return bos.toByteArray(); }
    static void html(HttpExchange ex, int code, String body) throws IOException { send(ex, code, "text/html; charset=utf-8", body.getBytes(UTF8)); }
    static void text(HttpExchange ex, int code, String body) throws IOException { send(ex, code, "text/plain; charset=utf-8", body.getBytes(UTF8)); }
    static void json(HttpExchange ex, String body) throws IOException { send(ex, 200, "application/json; charset=utf-8", body.getBytes(UTF8)); }
    static void download(HttpExchange ex, String type, String filename, byte[] data) throws IOException { ex.getResponseHeaders().set("Content-Disposition","attachment; filename*=UTF-8''"+enc(filename)); send(ex,200,type,data); }
    static void send(HttpExchange ex, int code, String type, byte[] data) throws IOException { ex.getResponseHeaders().set("Content-Type", type); ex.sendResponseHeaders(code, data.length); OutputStream os=ex.getResponseBody(); os.write(data); os.close(); }
    static void redirect(HttpExchange ex, String loc) throws IOException { ex.getResponseHeaders().set("Location", loc); ex.sendResponseHeaders(302, -1); ex.close(); }
    static void sendUpload(HttpExchange ex, String path) throws IOException { Path file=UPLOAD_DIR.resolve(path.substring("/uploads/".length())).normalize(); if(!file.startsWith(UPLOAD_DIR)||!Files.exists(file)){text(ex,404,"not found");return;} send(ex,200,Files.probeContentType(file),Files.readAllBytes(file)); }
    static String baseUrl(HttpExchange ex) {
        String configured = configuredBaseUrl();
        if (configured.length() > 0) return configured;
        Headers h = ex.getRequestHeaders();
        String host = h.getFirst("Host");
        if (host == null || isLocalHost(host)) {
            String lanIp = firstLanIpv4();
            return "http://" + lanIp + ":" + PORT;
        }
        return "http://" + host;
    }
    static String configuredBaseUrl() {
        if (!Files.exists(CONFIG_FILE)) return "";
        try {
            Properties props = new Properties();
            InputStream in = Files.newInputStream(CONFIG_FILE);
            props.load(new InputStreamReader(in, UTF8));
            in.close();
            String value = trim(props.getProperty("publicBaseUrl"));
            while (value.endsWith("/")) value = value.substring(0, value.length() - 1);
            return value;
        } catch (Exception ignored) {
            return "";
        }
    }
    static boolean isLocalHost(String host) {
        String h = lower(host);
        return h.startsWith("localhost") || h.startsWith("127.") || h.startsWith("[::1]") || h.startsWith("0.0.0.0");
    }
    static String firstLanIpv4() {
        try {
            DatagramSocket socket = new DatagramSocket();
            socket.connect(InetAddress.getByName("8.8.8.8"), 80);
            String ip = socket.getLocalAddress().getHostAddress();
            socket.close();
            if (ip.indexOf(':') < 0 && !ip.startsWith("127.")) return ip;
        } catch (Exception ignored) {
        }
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                if (!ni.isUp() || ni.isLoopback() || ni.isVirtual()) continue;
                Enumeration<InetAddress> addresses = ni.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    String ip = addr.getHostAddress();
                    if (ip.indexOf(':') < 0 && !ip.startsWith("127.")) return ip;
                }
            }
        } catch (Exception ignored) {
        }
        return "localhost";
    }

    static String esc(String s){ if(s==null)return""; return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;"); }
    static String attr(String s){ return esc(s); }
    static String js(String s){ return nvl(s).replace("\\","\\\\").replace("'","\\'").replace("\"","\\\"").replace("\n"," "); }
    static String enc(String s){ try{return java.net.URLEncoder.encode(nvl(s),"UTF-8").replace("+","%20");}catch(Exception e){return"";} }
    static String dec(String s){ try{return URLDecoder.decode(nvl(s),"UTF-8");}catch(Exception e){return"";} }
    static String nvl(String s){ return s==null?"":s; }
    static String trim(String s){ return nvl(s).trim(); }
    static String lower(String s){ return nvl(s).toLowerCase(Locale.ROOT); }
    static String sel(String a,String b){ return nvl(a).equals(b)?" selected":""; }
    static int parseInt(String s){ try{return Integer.parseInt(trim(s));}catch(Exception e){return 0;} }
    static String options(Set<String> vals, String selected){ StringBuilder sb=new StringBuilder(); for(String v:vals) if(v.length()>0) sb.append("<option value='").append(attr(v)).append("'").append(sel(selected,v)).append(">").append(esc(v)).append("</option>"); return sb.toString(); }
    static List<String> single(String s){ List<String> l=new ArrayList<String>(); if(nvl(s).length()>0)l.add(s); return l; }
    static List<String> splitPaths(String s){ List<String> l=new ArrayList<String>(); if(s==null||s.length()==0)return l; for(String x:s.split(",")) if(x.trim().length()>0) l.add(x.trim()); return l; }
    static String join(List<String> l){ StringBuilder sb=new StringBuilder(); for(String x:l){ if(sb.length()>0)sb.append(","); sb.append(x);} return sb.toString(); }
    static String safeFile(String s){ return nvl(s).replaceAll("[\\\\/:*?\"<>|\\s]+","_"); }
    static String fmt(double d){ return String.format(Locale.US, "%.3f", d); }

    static class Store {
        List<Person> persons = new ArrayList<Person>();
        Map<String, Account> accounts = new LinkedHashMap<String, Account>();
        synchronized void load() {
            persons = readObj(PERSON_DB, new ArrayList<Person>());
            accounts = readObj(ACCOUNT_DB, new LinkedHashMap<String, Account>());
            if (!accounts.containsKey("admin")) accounts.put("admin", new Account("admin", "admin123", "ADMIN"));
            if (!accounts.containsKey("neiye")) accounts.put("neiye", new Account("neiye", "neiye123", "NEIYE"));
            saveAccounts();
        }
        synchronized void savePersons(){ writeObj(PERSON_DB, persons); }
        synchronized void saveAccounts(){ writeObj(ACCOUNT_DB, accounts); }
        synchronized Person find(String id){ for(Person p:persons) if(p.id.equals(id)) return p; return null; }
        synchronized void replace(Person p){ for(int i=0;i<persons.size();i++) if(persons.get(i).id.equals(p.id)){ persons.set(i,p); return; } }
        synchronized void incrementAgeOncePerYear(int year){ Path marker=DATA_DIR.resolve("age-updated-"+year+".txt"); if(Files.exists(marker))return; for(Person p:persons)p.age++; savePersons(); try{Files.write(marker, Collections.singletonList("done"));}catch(Exception ignored){} }
        @SuppressWarnings("unchecked") <T> T readObj(Path p, T def){ if(!Files.exists(p))return def; try(ObjectInputStream in=new ObjectInputStream(Files.newInputStream(p))){ return (T)in.readObject(); }catch(Exception e){ return def; } }
        void writeObj(Path p, Object o){ try{Files.createDirectories(p.getParent()); ObjectOutputStream out=new ObjectOutputStream(Files.newOutputStream(p)); out.writeObject(o); out.close();}catch(Exception e){ throw new RuntimeException(e); } }
    }

    static class Account implements Serializable { String username,password,role; Account(String u,String p,String r){username=u;password=p;role=r;} }
    static class SessionUser { String username,role; SessionUser(String u,String r){username=u;role=r;} boolean isAdmin(){return "ADMIN".equals(role);} }
    static class Person implements Serializable {
        String id="", name="", gender="", nation="", politicalStatus="", job="", workArea="", company="", photoPath="", insuranceExpiry="", technicalTitle="", technicalTitleMajor="", highestEducation="", highestDegree="", graduateSchool="", major="", graduationDate="", entryDate="", creator="", createdDate="";
        int age, safetyScore;
        List<String> insuranceImages=new ArrayList<String>(), responsibilityImages=new ArrayList<String>(), trainingImages=new ArrayList<String>(), examImages=new ArrayList<String>();
        List<Qualification> qualifications=new ArrayList<Qualification>();
        Person copy(){ try{ ByteArrayOutputStream b=new ByteArrayOutputStream(); ObjectOutputStream o=new ObjectOutputStream(b); o.writeObject(this); o.close(); ObjectInputStream in=new ObjectInputStream(new ByteArrayInputStream(b.toByteArray())); return (Person)in.readObject(); }catch(Exception e){ throw new RuntimeException(e);} }
    }
    static class Qualification implements Serializable { String name="", expiryDate=""; List<String> certificateImages=new ArrayList<String>(); }
    static class ValidationException extends Exception { ValidationException(String m){super(m);} }
    static class Part { String name="", filename="", contentType=""; byte[] data=new byte[0]; }
    static class MultipartForm {
        Map<String,List<Part>> parts=new LinkedHashMap<String,List<Part>>();
        String v(String name){ Part p=first(name); return p==null?"":new String(p.data, UTF8); }
        Part first(String name){ List<Part> l=parts.get(name); return l==null||l.isEmpty()?null:l.get(0); }
        Part firstFile(String name){ for(Part p:files(name)) return p; return null; }
        List<Part> files(String name){ List<Part> out=new ArrayList<Part>(); List<Part> l=parts.get(name); if(l!=null) for(Part p:l) if(p.filename!=null && p.filename.length()>0 && p.data.length>0) out.add(p); return out; }
        void add(Part p){ if(!parts.containsKey(p.name)) parts.put(p.name,new ArrayList<Part>()); parts.get(p.name).add(p); }
        static MultipartForm parse(HttpExchange ex) throws IOException {
            String ct=ex.getRequestHeaders().getFirst("Content-Type"); if(ct==null||!ct.contains("boundary=")) return new MultipartForm();
            String boundary=ct.substring(ct.indexOf("boundary=")+9).replace("\"","");
            byte[] body=readBytes(ex), b=("--"+boundary).getBytes(StandardCharsets.ISO_8859_1), sep=("\r\n--"+boundary).getBytes(StandardCharsets.ISO_8859_1), hh="\r\n\r\n".getBytes(StandardCharsets.ISO_8859_1);
            MultipartForm mf=new MultipartForm(); int pos=0;
            while(true){ int start=indexOf(body,b,pos); if(start<0)break; int partStart=start+b.length; if(partStart+2<body.length && body[partStart]=='-'&&body[partStart+1]=='-')break; if(partStart+2<=body.length && body[partStart]=='\r'&&body[partStart+1]=='\n')partStart+=2; int headerEnd=indexOf(body,hh,partStart); if(headerEnd<0)break; int dataStart=headerEnd+4; int next=indexOf(body,sep,dataStart); if(next<0)break; String headers=new String(body,partStart,headerEnd-partStart,StandardCharsets.ISO_8859_1); Part p=new Part(); for(String line:headers.split("\r\n")){ String low=line.toLowerCase(Locale.ROOT); if(low.startsWith("content-disposition")){ p.name=between(line,"name=\"","\""); p.filename=between(line,"filename=\"","\""); } if(low.startsWith("content-type")) p.contentType=line.substring(line.indexOf(":")+1).trim(); } p.data=Arrays.copyOfRange(body,dataStart,next); if(p.name.length()>0) mf.add(p); pos=next+2; }
            return mf;
        }
        static String between(String s,String a,String b){ int i=s.indexOf(a); if(i<0)return""; int j=s.indexOf(b,i+a.length()); return j<0?"":s.substring(i+a.length(),j); }
        static int indexOf(byte[] data, byte[] pat, int from){ outer: for(int i=from;i<=data.length-pat.length;i++){ for(int j=0;j<pat.length;j++) if(data[i+j]!=pat[j]) continue outer; return i; } return -1; }
    }

    static class BadgeImage {
        static byte[] make(Person p, String url) throws IOException {
            int modules=37, cell=9, quiet=4, qr=(modules+quiet*2)*cell, textH=54;
            BufferedImage img=new BufferedImage(qr, qr+textH, BufferedImage.TYPE_INT_RGB);
            Graphics2D g=img.createGraphics(); g.setColor(Color.WHITE); g.fillRect(0,0,img.getWidth(),img.getHeight()); g.setColor(Color.BLACK);
            boolean[][] m=matrix(modules,url); for(int y=0;y<modules;y++) for(int x=0;x<modules;x++) if(m[y][x]) g.fillRect((x+quiet)*cell,(y+quiet)*cell,cell,cell);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON); g.setFont(new Font("Microsoft YaHei", Font.BOLD, 18)); drawCenter(g, p.name+" "+p.job, qr, qr+21); g.setFont(new Font("Microsoft YaHei", Font.PLAIN, 15)); drawCenter(g, p.company, qr, qr+43); g.dispose();
            ByteArrayOutputStream out=new ByteArrayOutputStream(); ImageIO.write(img,"png",out); return out.toByteArray();
        }
        static boolean[][] matrix(int n,String url){
            byte[] msg=url.getBytes(UTF8);
            if(msg.length>106) msg=Arrays.copyOf(msg,106);
            boolean[][] m=new boolean[n][n]; boolean[][] res=new boolean[n][n];
            finder(m,res,0,0); finder(m,res,n-7,0); finder(m,res,0,n-7);
            for(int i=8;i<n-8;i++){ set(m,res,6,i,i%2==0); set(m,res,i,6,i%2==0); }
            align(m,res,30,30);
            set(m,res,8,n-8,true);
            reserveFormat(m,res);
            byte[] data=dataCodewords(msg);
            byte[] ec=reedSolomon(data,26);
            byte[] all=new byte[data.length+ec.length]; System.arraycopy(data,0,all,0,data.length); System.arraycopy(ec,0,all,data.length,ec.length);
            int bit=0, dir=-1;
            for(int x=n-1;x>=1;x-=2){
                if(x==6)x--;
                for(int yi=0;yi<n;yi++){
                    int y=dir==1?yi:n-1-yi;
                    for(int dx=0;dx<2;dx++){
                        int xx=x-dx;
                        if(res[y][xx]) continue;
                        boolean val=false;
                        if(bit<all.length*8) val=((all[bit>>>3]>>(7-(bit&7)))&1)!=0;
                        if(((xx+y)&1)==0) val=!val;
                        m[y][xx]=val; bit++;
                    }
                }
                dir=-dir;
            }
            format(m,res,0);
            return m;
        }
        static byte[] dataCodewords(byte[] msg){
            BitBuffer bb=new BitBuffer();
            bb.append(0x4,4); bb.append(msg.length,8); for(byte b:msg) bb.append(b&255,8);
            int cap=108*8; bb.append(0,Math.min(4,cap-bb.len)); while(bb.len%8!=0) bb.append(0,1);
            ByteArrayOutputStream out=new ByteArrayOutputStream(); for(int i=0;i<bb.len;i+=8) out.write(bb.getByte(i));
            int pad=0; while(out.size()<108){ out.write((pad++&1)==0?0xec:0x11); }
            return out.toByteArray();
        }
        static void finder(boolean[][]m, boolean[][]r, int x,int y){
            for(int yy=-1;yy<=7;yy++) for(int xx=-1;xx<=7;xx++){
                int X=x+xx,Y=y+yy; if(X<0||Y<0||Y>=m.length||X>=m.length) continue;
                boolean dark=xx>=0&&xx<=6&&yy>=0&&yy<=6&&(xx==0||yy==0||xx==6||yy==6||(xx>=2&&xx<=4&&yy>=2&&yy<=4));
                set(m,r,X,Y,dark);
            }
        }
        static void align(boolean[][]m, boolean[][]r, int cx,int cy){ for(int y=-2;y<=2;y++) for(int x=-2;x<=2;x++) set(m,r,cx+x,cy+y,Math.max(Math.abs(x),Math.abs(y))!=1); }
        static void reserveFormat(boolean[][]m, boolean[][]r){
            int n=m.length;
            for(int i=0;i<=5;i++) set(m,r,8,i,false);
            set(m,r,8,7,false); set(m,r,8,8,false); set(m,r,7,8,false);
            for(int i=9;i<15;i++) set(m,r,14-i,8,false);
            for(int i=0;i<8;i++) set(m,r,n-1-i,8,false);
            for(int i=8;i<15;i++) set(m,r,8,n-15+i,false);
        }
        static void format(boolean[][]m, boolean[][]r, int mask){
            int data=(1<<3)|mask, rem=data;
            for(int i=0;i<10;i++) rem=(rem<<1)^(((rem>>>9)&1)*0x537);
            int bits=((data<<10)|rem)^0x5412, n=m.length;
            for(int i=0;i<=5;i++) set(m,r,8,i,bit(bits,i));
            set(m,r,8,7,bit(bits,6)); set(m,r,8,8,bit(bits,7)); set(m,r,7,8,bit(bits,8));
            for(int i=9;i<15;i++) set(m,r,14-i,8,bit(bits,i));
            for(int i=0;i<8;i++) set(m,r,n-1-i,8,bit(bits,i));
            for(int i=8;i<15;i++) set(m,r,8,n-15+i,bit(bits,i));
        }
        static boolean bit(int v,int i){ return ((v>>>i)&1)!=0; }
        static void set(boolean[][]m, boolean[][]r, int x,int y, boolean v){ m[y][x]=v; r[y][x]=true; }
        static byte[] reedSolomon(byte[] data,int degree){
            int[] gen={1};
            for(int i=0;i<degree;i++){ int[] next=new int[gen.length+1]; for(int j=0;j<gen.length;j++){ next[j]^=mul(gen[j],1); next[j+1]^=mul(gen[j],exp(i)); } gen=next; }
            int[] rem=new int[degree];
            for(byte b:data){ int factor=(b&255)^rem[0]; System.arraycopy(rem,1,rem,0,degree-1); rem[degree-1]=0; for(int i=0;i<degree;i++) rem[i]^=mul(gen[i+1],factor); }
            byte[] out=new byte[degree]; for(int i=0;i<degree;i++) out[i]=(byte)rem[i]; return out;
        }
        static int exp(int e){ int x=1; for(int i=0;i<e;i++) x=mul(x,2); return x; }
        static int mul(int a,int b){ int p=0; for(int i=0;i<8;i++){ if((b&1)!=0)p^=a; boolean hi=(a&0x80)!=0; a=(a<<1)&0xff; if(hi)a^=0x1d; b>>>=1; } return p; }
        static void drawCenter(Graphics2D g,String s,int w,int y){ FontMetrics fm=g.getFontMetrics(); g.drawString(s,(w-fm.stringWidth(s))/2,y); }
        static class BitBuffer { int[] bits=new int[900]; int len=0; void append(int val,int count){ for(int i=count-1;i>=0;i--) bits[len++]=(val>>>i)&1; } int getByte(int from){ int v=0; for(int i=0;i<8;i++) v=(v<<1)|bits[from+i]; return v; } }
    }

    static class FaceRecognition {
        static final double THRESHOLD = 0.66;
        static double score(byte[] a, byte[] b) throws IOException {
            Feature fa=feature(a), fb=feature(b);
            double block=1.0 - avgAbs(fa.blocks, fb.blocks) / 255.0;
            double hist=1.0 - avgAbs(fa.hist, fb.hist);
            double hash=1.0 - hamming(fa.hash, fb.hash) / 64.0;
            double color=1.0 - avgAbs(fa.color, fb.color) / 255.0;
            double s=0.38*block+0.22*hist+0.25*hash+0.15*color;
            if (Arrays.equals(a,b)) s = 0.995;
            return Math.max(0, Math.min(1, s));
        }
        static Feature feature(byte[] bytes) throws IOException {
            BufferedImage src=ImageIO.read(new ByteArrayInputStream(bytes)); if(src==null) throw new IOException("图片无法读取");
            int side=Math.min(src.getWidth(), src.getHeight()); int sx=(src.getWidth()-side)/2, sy=(src.getHeight()-side)/2;
            BufferedImage img=new BufferedImage(64,64,BufferedImage.TYPE_INT_RGB); Graphics2D g=img.createGraphics(); g.drawImage(src,0,0,64,64,sx,sy,sx+side,sy+side,null); g.dispose();
            Feature f=new Feature(); double sum=0; int k=0; for(int by=0;by<8;by++) for(int bx=0;bx<8;bx++){ double v=0; for(int y=0;y<8;y++) for(int x=0;x<8;x++) v+=gray(img.getRGB(bx*8+x,by*8+y)); f.blocks[k++]=v/64; sum+=v/64; }
            double avg=sum/64; long h=0; for(int i=0;i<64;i++) if(f.blocks[i]>=avg) h|=(1L<<i); f.hash=h;
            for(int y=0;y<64;y++) for(int x=0;x<64;x++){ int rgb=img.getRGB(x,y); int gr=gray(rgb); f.hist[gr/16]+=1.0/4096; f.color[0]+=((rgb>>16)&255)/4096.0; f.color[1]+=((rgb>>8)&255)/4096.0; f.color[2]+=(rgb&255)/4096.0; }
            return f;
        }
        static int gray(int rgb){ return (int)(((rgb>>16)&255)*0.299 + ((rgb>>8)&255)*0.587 + (rgb&255)*0.114); }
        static double avgAbs(double[]a,double[]b){ double s=0; for(int i=0;i<a.length;i++) s+=Math.abs(a[i]-b[i]); return s/a.length; }
        static int hamming(long a,long b){ return Long.bitCount(a^b); }
        static class Feature { double[] blocks=new double[64], hist=new double[16], color=new double[3]; long hash; }
    }
}
