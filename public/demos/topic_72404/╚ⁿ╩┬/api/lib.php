<?php
/**
 * 社区智慧服务系统 —— PHP 后端公共函数库
 * 与 Node.js 版本 (server.js) 保持数据格式兼容
 * 敏感数据（用户、会话、验证码、订单、收款配置、商家收款）默认存入 SQLite
 */

// 关闭错误显示，统一 JSON 输出
error_reporting(E_ALL);
ini_set('display_errors', '0');

// 支持跨域
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 数据目录
$GLOBALS['DATA_DIR'] = __DIR__ . '/../data';
if (!is_dir($GLOBALS['DATA_DIR'])) {
    @mkdir($GLOBALS['DATA_DIR'], 0755, true);
}
$GLOBALS['DB_FILE'] = $GLOBALS['DATA_DIR'] . '/app.db';

// 默认返回
function jsonResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail($reason) {
    jsonResponse(['ok' => false, 'reason' => $reason]);
}

function ok($data = []) {
    jsonResponse(array_merge(['ok' => true], $data));
}

// 读取 JSON 数据文件（用于非敏感数据）
function readData($file, $fallback = null) {
    $path = $GLOBALS['DATA_DIR'] . '/' . $file;
    if (!file_exists($path)) return $fallback;
    $content = @file_get_contents($path);
    if ($content === false) return $fallback;
    $decoded = json_decode($content, true);
    return ($decoded === null && $content !== 'null') ? $fallback : $decoded;
}

// 写入 JSON 数据文件（带文件锁）
function writeData($file, $data) {
    $path = $GLOBALS['DATA_DIR'] . '/' . $file;
    $dir = dirname($path);
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $tmp = $path . '.tmp';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    file_put_contents($tmp, $json, LOCK_EX);
    rename($tmp, $path);
    return true;
}

// 生成唯一 ID
function uid($prefix = 'id_') {
    return $prefix . base_convert((string) microtime(true), 10, 36) . '_' . substr(base_convert((string) mt_rand(), 10, 36), 0, 6);
}

function now() {
    return round(microtime(true) * 1000);
}

function isValidPhone($phone) {
    return preg_match('/^1[3-9]\d{9}$/', trim((string)$phone)) === 1;
}

// ==================== 数据库层（SQLite） ====================
function dbEnabled() {
    return extension_loaded('pdo_sqlite');
}

function getDb() {
    static $pdo = null;
    if ($pdo) return $pdo;
    if (!dbEnabled()) return null;
    try {
        $pdo = new PDO('sqlite:' . $GLOBALS['DB_FILE']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('PRAGMA foreign_keys = ON;');
        initDb($pdo);
        return $pdo;
    } catch (Exception $e) {
        error_log('数据库连接失败: ' . $e->getMessage());
        return null;
    }
}

function initDb($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        communityId TEXT DEFAULT '',
        certification TEXT,
        createdAt INTEGER DEFAULT 0
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)");

    $pdo->exec("CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        loginAt INTEGER DEFAULT 0,
        expiresAt INTEGER DEFAULT 0
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS codes (
        phone TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expiresAt INTEGER DEFAULT 0
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        orderNo TEXT NOT NULL UNIQUE,
        productId TEXT NOT NULL,
        productTitle TEXT DEFAULT '',
        productPhoto TEXT DEFAULT '',
        price REAL DEFAULT 0,
        payMethod TEXT DEFAULT 'wechat',
        status TEXT DEFAULT 'pending',
        buyerId TEXT DEFAULT '',
        buyerName TEXT DEFAULT '',
        buyerPhone TEXT DEFAULT '',
        buyerAddress TEXT DEFAULT '',
        merchantId TEXT DEFAULT '',
        merchantName TEXT DEFAULT '',
        createdAt INTEGER DEFAULT 0,
        paidAt INTEGER DEFAULT 0,
        tradeNo TEXT DEFAULT ''
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchantId)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyerPhone)");

    $pdo->exec("CREATE TABLE IF NOT EXISTS merchants (
        id TEXT PRIMARY KEY,
        config TEXT NOT NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS pay_config (
        id TEXT PRIMARY KEY,
        config TEXT NOT NULL
    )");
}

function dbExec($sql, $params = []) {
    $pdo = getDb();
    if (!$pdo) return false;
    $stmt = $pdo->prepare($sql);
    return $stmt->execute($params);
}

function dbFetchAll($sql, $params = []) {
    $pdo = getDb();
    if (!$pdo) return [];
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function dbFetchOne($sql, $params = []) {
    $rows = dbFetchAll($sql, $params);
    return $rows ? $rows[0] : null;
}

// ==================== 敏感数据读写（优先数据库） ====================
function loadUsers() {
    if (!getDb()) return readData('users.json', []);
    $rows = dbFetchAll('SELECT * FROM users ORDER BY createdAt DESC');
    if (!$rows) $rows = [];
    $users = [];
    foreach ($rows as $r) {
        $r['certification'] = !empty($r['certification']) ? json_decode($r['certification'], true) : null;
        $users[] = $r;
    }
    // 首次运行：若数据库为空且存在旧 JSON，自动迁移
    if (!$users && file_exists($GLOBALS['DATA_DIR'] . '/users.json')) {
        $users = readData('users.json', []);
        saveUsers($users);
    }
    return $users;
}

function saveUsers($users = null) {
    if ($users === null) $users = $GLOBALS['USERS'];
    $GLOBALS['USERS'] = $users;
    $pdo = getDb();
    if (!$pdo) { writeData('users.json', $users); return true; }
    $pdo->exec('DELETE FROM users');
    $stmt = $pdo->prepare('INSERT INTO users (id, phone, role, status, communityId, certification, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
    foreach ($users as $u) {
        $cert = isset($u['certification']) && $u['certification'] ? json_encode($u['certification'], JSON_UNESCAPED_UNICODE) : null;
        $stmt->execute([
            $u['id'], $u['phone'], $u['role'], $u['status'],
            $u['communityId'] ?? '', $cert, $u['createdAt'] ?? 0
        ]);
    }
    return true;
}

function loadSessions() {
    if (!getDb()) return readData('sessions.json', []);
    $rows = dbFetchAll('SELECT * FROM sessions');
    $sessions = [];
    foreach ($rows as $r) {
        $token = $r['token'];
        unset($r['token']);
        $sessions[$token] = $r;
    }
    if (!$sessions && file_exists($GLOBALS['DATA_DIR'] . '/sessions.json')) {
        $sessions = readData('sessions.json', []);
        saveSessions($sessions);
    }
    return $sessions;
}

function saveSessions($sessions = null) {
    if ($sessions === null) $sessions = $GLOBALS['SESSIONS'];
    $GLOBALS['SESSIONS'] = $sessions;
    $pdo = getDb();
    if (!$pdo) { writeData('sessions.json', $sessions); return true; }
    $pdo->exec('DELETE FROM sessions');
    $stmt = $pdo->prepare('INSERT INTO sessions (token, userId, phone, role, loginAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?)');
    foreach ($sessions as $token => $s) {
        $stmt->execute([$token, $s['userId'], $s['phone'], $s['role'], $s['loginAt'] ?? 0, $s['expiresAt'] ?? 0]);
    }
    return true;
}

function loadCodes() {
    if (!getDb()) return readData('codes.json', []);
    $rows = dbFetchAll('SELECT * FROM codes');
    $codes = [];
    foreach ($rows as $r) {
        $phone = $r['phone'];
        unset($r['phone']);
        $codes[$phone] = $r;
    }
    if (!$codes && file_exists($GLOBALS['DATA_DIR'] . '/codes.json')) {
        $codes = readData('codes.json', []);
        saveCodes($codes);
    }
    return $codes;
}

function saveCodes($codes = null) {
    if ($codes === null) $codes = $GLOBALS['CODES'];
    $GLOBALS['CODES'] = $codes;
    $pdo = getDb();
    if (!$pdo) { writeData('codes.json', $codes); return true; }
    $pdo->exec('DELETE FROM codes');
    $stmt = $pdo->prepare('INSERT INTO codes (phone, code, expiresAt) VALUES (?, ?, ?)');
    foreach ($codes as $phone => $c) {
        $stmt->execute([$phone, $c['code'], $c['expiresAt'] ?? 0]);
    }
    return true;
}

function loadOrders() {
    if (!getDb()) return readData('orders.json', []);
    $rows = dbFetchAll('SELECT * FROM orders ORDER BY createdAt DESC');
    if (!$rows) $rows = [];
    if (!$rows && file_exists($GLOBALS['DATA_DIR'] . '/orders.json')) {
        $rows = readData('orders.json', []);
        saveOrders($rows);
    }
    return $rows;
}

function saveOrders($orders = null) {
    if ($orders === null) $orders = $GLOBALS['ORDERS'];
    $GLOBALS['ORDERS'] = $orders;
    $pdo = getDb();
    if (!$pdo) { writeData('orders.json', $orders); return true; }
    $pdo->exec('DELETE FROM orders');
    $stmt = $pdo->prepare('INSERT INTO orders (id, orderNo, productId, productTitle, productPhoto, price, payMethod, status, buyerId, buyerName, buyerPhone, buyerAddress, merchantId, merchantName, createdAt, paidAt, tradeNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    foreach ($orders as $o) {
        $stmt->execute([
            $o['id'], $o['orderNo'], $o['productId'], $o['productTitle'] ?? '', $o['productPhoto'] ?? '',
            $o['price'] ?? 0, $o['payMethod'] ?? 'wechat', $o['status'] ?? 'pending',
            $o['buyerId'] ?? '', $o['buyerName'] ?? '', $o['buyerPhone'] ?? '', $o['buyerAddress'] ?? '',
            $o['merchantId'] ?? '', $o['merchantName'] ?? '', $o['createdAt'] ?? 0, $o['paidAt'] ?? 0, $o['tradeNo'] ?? ''
        ]);
    }
    return true;
}

function loadMerchants() {
    if (!getDb()) return readData('merchants.json', []);
    $rows = dbFetchAll('SELECT * FROM merchants');
    $merchants = [];
    foreach ($rows as $r) {
        $merchants[$r['id']] = !empty($r['config']) ? json_decode($r['config'], true) : [];
    }
    if (!$merchants && file_exists($GLOBALS['DATA_DIR'] . '/merchants.json')) {
        $merchants = readData('merchants.json', []);
        saveMerchants($merchants);
    }
    return $merchants;
}

function saveMerchants($merchants = null) {
    if ($merchants === null) $merchants = $GLOBALS['MERCHANTS'];
    $GLOBALS['MERCHANTS'] = $merchants;
    $pdo = getDb();
    if (!$pdo) { writeData('merchants.json', $merchants); return true; }
    $pdo->exec('DELETE FROM merchants');
    $stmt = $pdo->prepare('INSERT INTO merchants (id, config) VALUES (?, ?)');
    foreach ($merchants as $id => $config) {
        $stmt->execute([$id, json_encode($config, JSON_UNESCAPED_UNICODE)]);
    }
    return true;
}

function loadPayConfig() {
    if (!getDb()) {
        return readData('pay_config.json', [
            'admin' => [
                'wechat' => ['enabled' => false, 'appId' => '', 'mchId' => '', 'key' => '', 'notifyUrl' => '', 'qrCode' => '', 'payUrl' => ''],
                'alipay' => ['enabled' => false, 'appId' => '', 'merchantId' => '', 'privateKey' => '', 'notifyUrl' => '', 'qrCode' => '', 'payUrl' => '']
            ]
        ]);
    }
    $row = dbFetchOne('SELECT * FROM pay_config WHERE id = ?', ['admin']);
    $config = null;
    if ($row && !empty($row['config'])) {
        $config = json_decode($row['config'], true);
    }
    if (!$config && file_exists($GLOBALS['DATA_DIR'] . '/pay_config.json')) {
        $config = readData('pay_config.json', null);
        savePayConfig($config);
    }
    return $config ?: [
        'admin' => [
            'wechat' => ['enabled' => false, 'appId' => '', 'mchId' => '', 'key' => '', 'notifyUrl' => '', 'qrCode' => '', 'payUrl' => ''],
            'alipay' => ['enabled' => false, 'appId' => '', 'merchantId' => '', 'privateKey' => '', 'notifyUrl' => '', 'qrCode' => '', 'payUrl' => '']
        ]
    ];
}

function savePayConfig($config = null) {
    if ($config === null) $config = $GLOBALS['PAY_CONFIG'];
    $GLOBALS['PAY_CONFIG'] = $config;
    $pdo = getDb();
    if (!$pdo) { writeData('pay_config.json', $config); return true; }
    dbExec('DELETE FROM pay_config WHERE id = ?', ['admin']);
    $stmt = $pdo->prepare('INSERT INTO pay_config (id, config) VALUES (?, ?)');
    $stmt->execute(['admin', json_encode($config, JSON_UNESCAPED_UNICODE)]);
    return true;
}

// ==================== 数据加载 ====================
$GLOBALS['USERS'] = loadUsers();
$GLOBALS['CODES'] = loadCodes();
$GLOBALS['COMMUNITIES'] = readData('communities.json', []);
$GLOBALS['ANNOUNCEMENTS'] = readData('announcements.json', []);
$GLOBALS['FACILITIES'] = readData('facilities.json', []);
$GLOBALS['PRODUCTS'] = readData('products.json', []);
$GLOBALS['ORDERS'] = loadOrders();
$GLOBALS['PAY_CONFIG'] = loadPayConfig();
$GLOBALS['MERCHANTS'] = loadMerchants();
$GLOBALS['SESSIONS'] = loadSessions();

// 保存函数（非敏感数据仍使用 JSON）
function saveCommunities() { writeData('communities.json', $GLOBALS['COMMUNITIES']); }
function saveAnnouncements() { writeData('announcements.json', $GLOBALS['ANNOUNCEMENTS']); }
function saveFacilities() { writeData('facilities.json', $GLOBALS['FACILITIES']); }
function saveProducts() { writeData('products.json', $GLOBALS['PRODUCTS']); }

// ==================== 初始化种子数据 ====================
function ensureSeedUsers() {
    if (!is_array($GLOBALS['USERS']) || count($GLOBALS['USERS']) === 0) {
        $GLOBALS['USERS'] = [[
            'id' => uid('u_'),
            'phone' => 'admin',
            'role' => 'admin',
            'status' => 'active',
            'communityId' => '',
            'createdAt' => now()
        ]];
        saveUsers();
    }
}
ensureSeedUsers();

// ==================== 辅助查找函数 ====================
function findUserByPhone($phone) {
    foreach ($GLOBALS['USERS'] as $u) {
        if ($u['phone'] === $phone) return $u;
    }
    return null;
}

function findUserById($id) {
    foreach ($GLOBALS['USERS'] as $u) {
        if ($u['id'] === $id) return $u;
    }
    return null;
}

function findUserIndexById($id) {
    foreach ($GLOBALS['USERS'] as $i => $u) {
        if ($u['id'] === $id) return $i;
    }
    return -1;
}

function findCommunityById($id) {
    foreach ($GLOBALS['COMMUNITIES'] as $c) {
        if ($c['id'] === $id) return $c;
    }
    return null;
}

function findCommunityByInviteCode($code) {
    $code = trim((string)$code);
    foreach ($GLOBALS['COMMUNITIES'] as $c) {
        if ($c['inviteCode'] === $code) return $c;
    }
    return null;
}

function findProductById($id) {
    foreach ($GLOBALS['PRODUCTS'] as $p) {
        if ($p['id'] === $id) return $p;
    }
    return null;
}

function findOrderById($id) {
    foreach ($GLOBALS['ORDERS'] as $o) {
        if ($o['id'] === $id) return $o;
    }
    return null;
}

function findOrderByOrderNo($orderNo) {
    foreach ($GLOBALS['ORDERS'] as $o) {
        if ($o['orderNo'] === $orderNo) return $o;
    }
    return null;
}

function findFacilityIndexById($id) {
    foreach ($GLOBALS['FACILITIES'] as $i => $f) {
        if ($f['id'] === $id) return $i;
    }
    return -1;
}

function findAnnouncementIndexById($id) {
    foreach ($GLOBALS['ANNOUNCEMENTS'] as $i => $a) {
        if ($a['id'] === $id) return $i;
    }
    return -1;
}

function findProductIndexById($id) {
    foreach ($GLOBALS['PRODUCTS'] as $i => $p) {
        if ($p['id'] === $id) return $i;
    }
    return -1;
}

function findCommunityIndexById($id) {
    foreach ($GLOBALS['COMMUNITIES'] as $i => $c) {
        if ($c['id'] === $id) return $i;
    }
    return -1;
}

// ==================== 请求解析 ====================
function getBody() {
    if (isset($GLOBALS['REQUEST_BODY']) && is_array($GLOBALS['REQUEST_BODY'])) {
        return $GLOBALS['REQUEST_BODY'];
    }
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        $GLOBALS['REQUEST_BODY'] = [];
        return [];
    }
    $decoded = json_decode($raw, true);
    $GLOBALS['REQUEST_BODY'] = is_array($decoded) ? $decoded : [];
    return $GLOBALS['REQUEST_BODY'];
}

function getToken() {
    $headers = [];
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    } else {
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $name = str_replace('_', '-', substr($key, 5));
                $headers[$name] = $value;
            }
        }
    }
    $auth = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    if (!$auth && isset($_SERVER['HTTP_AUTHORIZATION'])) $auth = $_SERVER['HTTP_AUTHORIZATION'];
    if (!$auth && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    $token = str_replace('Bearer ', '', $auth);
    if (!$token && isset($_GET['token'])) $token = $_GET['token'];
    if (!$token) {
        $body = getBody();
        if (isset($body['token'])) $token = $body['token'];
    }
    return $token;
}

function authMiddleware() {
    $token = getToken();
    if (!$token) fail('请先登录');
    $session = isset($GLOBALS['SESSIONS'][$token]) ? $GLOBALS['SESSIONS'][$token] : null;
    if (!$session) fail('登录已过期');
    if ($session['expiresAt'] < now()) {
        unset($GLOBALS['SESSIONS'][$token]);
        saveSessions();
        fail('登录已过期');
    }
    return [
        'userId' => $session['userId'],
        'userRole' => $session['role'],
        'userPhone' => $session['phone']
    ];
}

function requireRole($ctx, $role) {
    if ($ctx['userRole'] !== $role && $ctx['userRole'] !== 'admin') {
        fail('权限不足');
    }
}

// ==================== 数组工具 ====================
function arrayFilter(&$arr, $callback) {
    $result = [];
    foreach ($arr as $item) {
        if ($callback($item)) $result[] = $item;
    }
    return $result;
}
