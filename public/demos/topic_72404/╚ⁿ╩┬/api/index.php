<?php
/**
 * 社区智慧服务系统 —— PHP API 路由入口
 * 兼容前端 api-client.js 的所有调用
 */

require __DIR__ . '/lib.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^/api/#', '', $uri);
$uri = trim($uri, '/');
$body = getBody();

function matchRoute($pattern, $uri, &$params = []) {
    $regex = '#^' . preg_replace('#:([a-zA-Z0-9_]+)#', '(?P<$1>[^/]+)', $pattern) . '$#';
    if (preg_match($regex, $uri, $m)) {
        foreach ($m as $k => $v) {
            if (is_string($k)) $params[$k] = $v;
        }
        return true;
    }
    return false;
}

// ==================== 健康检查 ====================
if ($method === 'GET' && $uri === 'health') {
    ok(['time' => now(), 'userCount' => count($GLOBALS['USERS'])]);
}

// ==================== 地址 API 代理 ====================
if ($method === 'GET' && $uri === 'district') {
    $adcode = isset($_GET['adcode']) ? $_GET['adcode'] : '';
    if (!$adcode) fail('缺少adcode参数');
    $url = 'https://uapis.cn/api/v1/misc/district?adcode=' . urlencode($adcode);
    $res = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        curl_close($ch);
    }
    if ($res === false && ini_get('allow_url_fopen')) {
        $res = @file_get_contents($url, false, stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]));
    }
    if ($res === false || !$res) fail('地址服务暂时不可用');
    $json = json_decode($res, true);
    if ($json === null) fail('API响应解析失败');
    jsonResponse($json);
}

// ==================== 验证码 ====================
if ($method === 'POST' && $uri === 'codes/generate') {
    $phone = isset($body['phone']) ? $body['phone'] : '';
    if (!isValidPhone($phone)) fail('请输入有效的手机号');
    $code = str_pad((string) mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
    $GLOBALS['CODES'][$phone] = ['code' => $code, 'expiresAt' => now() + 5 * 60 * 1000];
    saveCodes();
    error_log('[验证码] ' . $phone . ' -> ' . $code);
    ok(['code' => $code]);
}

if ($method === 'POST' && $uri === 'codes/verify') {
    $phone = isset($body['phone']) ? $body['phone'] : '';
    $code = isset($body['code']) ? trim((string)$body['code']) : '';
    if (!preg_match('/^\d{6}$/', $code)) fail('请输入6位数字验证码');
    $record = isset($GLOBALS['CODES'][$phone]) ? $GLOBALS['CODES'][$phone] : null;
    if (!$record) fail('验证码不存在');
    if ($record['expiresAt'] < now()) {
        unset($GLOBALS['CODES'][$phone]);
        saveCodes();
        fail('验证码已过期');
    }
    if ($record['code'] !== $code) fail('验证码错误');
    unset($GLOBALS['CODES'][$phone]);
    saveCodes();
    ok();
}

// ==================== 用户注册/登录 ====================
if ($method === 'POST' && $uri === 'users/register') {
    $phone = isset($body['phone']) ? $body['phone'] : '';
    $role = isset($body['role']) ? $body['role'] : 'user';
    if (!isValidPhone($phone)) fail('请输入有效的手机号');
    if (findUserByPhone($phone)) fail('该手机号已注册');
    $needsCert = ($role === 'property' || $role === 'restaurant');
    $user = [
        'id' => uid('u_'),
        'phone' => $phone,
        'role' => $role,
        'status' => $needsCert ? 'pending_cert' : 'active',
        'communityId' => '',
        'createdAt' => now()
    ];
    if ($needsCert) {
        $user['certification'] = [
            'companyName' => '',
            'contactName' => '',
            'documents' => [],
            'inviteCode' => '',
            'restaurantData' => $role === 'restaurant' ? [
                'shopName' => '',
                'kitchenPhotos' => [],
                'shopPhotos' => [],
                'licensePhoto' => null
            ] : null,
            'status' => 'pending',
            'reviewNote' => '',
            'submittedAt' => 0,
            'reviewedAt' => 0
        ];
    }
    $GLOBALS['USERS'][] = $user;
    saveUsers();
    ok(['user' => $user]);
}

function doLogin($phone) {
    $user = findUserByPhone($phone);
    if (!$user) {
        if ($phone !== 'admin') {
            $user = [
                'id' => uid('u_'),
                'phone' => $phone,
                'role' => 'user',
                'status' => 'active',
                'communityId' => '',
                'createdAt' => now()
            ];
            $GLOBALS['USERS'][] = $user;
            saveUsers();
        }
    }
    if (!$user) fail('用户不存在');
    $token = 'tk_' . base_convert((string) now(), 10, 36) . substr(base_convert((string) mt_rand(), 10, 36), 0, 8);
    $GLOBALS['SESSIONS'][$token] = [
        'userId' => $user['id'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'loginAt' => now(),
        'expiresAt' => now() + 7 * 24 * 60 * 60 * 1000
    ];
    saveSessions();
    ok([
        'user' => $user,
        'token' => $token,
        'session' => [
            'userId' => $user['id'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'loginAt' => now()
        ]
    ]);
}

if ($method === 'POST' && $uri === 'auth/login') {
    $phone = isset($body['phone']) ? $body['phone'] : '';
    $code = isset($body['code']) ? $body['code'] : '';
    if ($phone !== 'admin') {
        if (!isValidPhone($phone)) fail('请输入有效的手机号');
        if (!$code) fail('请输入验证码');
        $s = trim((string)$code);
        if (!preg_match('/^\d{6}$/', $s)) fail('验证码格式错误');
        $record = isset($GLOBALS['CODES'][$phone]) ? $GLOBALS['CODES'][$phone] : null;
        if (!$record) fail('验证码不存在');
        if ($record['expiresAt'] < now()) {
            unset($GLOBALS['CODES'][$phone]);
            saveCodes();
            fail('验证码已过期');
        }
        if ($record['code'] !== $s) fail('验证码错误');
        unset($GLOBALS['CODES'][$phone]);
        saveCodes();
    }
    doLogin($phone);
}

if ($method === 'POST' && $uri === 'auth/admin-login') {
    $password = isset($body['password']) ? trim((string)$body['password']) : '';
    if ($password !== 'admin888') fail('管理密码不正确');
    ensureSeedUsers();
    doLogin('admin');
}

// ==================== 用户管理 ====================
if ($method === 'GET' && $uri === 'users') {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $role = isset($_GET['role']) ? $_GET['role'] : '';
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $list = $GLOBALS['USERS'];
    if ($role) $list = arrayFilter($list, function($u) use ($role) { return $u['role'] === $role; });
    if ($status) $list = arrayFilter($list, function($u) use ($status) { return $u['status'] === $status; });
    usort($list, function($a, $b) { return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
    ok(['list' => $list, 'total' => count($list)]);
}

$params = [];
if ($method === 'GET' && matchRoute('users/:id', $uri, $params)) {
    $ctx = authMiddleware();
    $user = findUserById($params['id']);
    if (!$user) fail('用户不存在');
    if ($ctx['userRole'] !== 'admin' && $ctx['userId'] !== $user['id']) fail('权限不足');
    ok(['user' => $user]);
}

if ($method === 'GET' && $uri === 'me') {
    $ctx = authMiddleware();
    $user = findUserById($ctx['userId']);
    if (!$user) fail('用户不存在');
    ok(['user' => $user]);
}

if ($method === 'PUT' && matchRoute('users/:id', $uri, $params)) {
    $ctx = authMiddleware();
    $idx = findUserIndexById($params['id']);
    if ($idx < 0) fail('用户不存在');
    if ($ctx['userRole'] !== 'admin' && $ctx['userId'] !== $GLOBALS['USERS'][$idx]['id']) fail('权限不足');
    $protected = ['id', 'phone', 'role', 'createdAt'];
    foreach ($body as $key => $val) {
        if (!in_array($key, $protected)) {
            $GLOBALS['USERS'][$idx][$key] = $val;
        }
    }
    saveUsers();
    ok(['user' => $GLOBALS['USERS'][$idx]]);
}

if ($method === 'DELETE' && matchRoute('users/:id', $uri, $params)) {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $idx = findUserIndexById($params['id']);
    if ($idx < 0) fail('用户不存在');
    if ($GLOBALS['USERS'][$idx]['role'] === 'admin') fail('不能删除管理员');
    array_splice($GLOBALS['USERS'], $idx, 1);
    saveUsers();
    ok();
}

if ($method === 'POST' && $uri === 'users/change-phone') {
    $ctx = authMiddleware();
    $newPhone = isset($body['newPhone']) ? $body['newPhone'] : '';
    if (!isValidPhone($newPhone)) fail('请输入有效的手机号');
    foreach ($GLOBALS['USERS'] as $u) {
        if ($u['phone'] === $newPhone && $u['id'] !== $ctx['userId']) fail('该手机号已被其他账号使用');
    }
    $idx = findUserIndexById($ctx['userId']);
    if ($idx < 0) fail('用户不存在');
    $GLOBALS['USERS'][$idx]['phone'] = $newPhone;
    saveUsers();
    ok(['user' => $GLOBALS['USERS'][$idx]]);
}

// ==================== 社区管理 ====================
if ($method === 'GET' && $uri === 'communities') {
    $list = $GLOBALS['COMMUNITIES'];
    usort($list, function($a, $b) { return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
    ok(['list' => $list, 'total' => count($list)]);
}

if ($method === 'POST' && $uri === 'communities') {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $name = isset($body['name']) ? $body['name'] : '';
    $inviteCode = isset($body['inviteCode']) ? trim((string)$body['inviteCode']) : '';
    if (!$inviteCode) fail('邀请码不能为空');
    if (findCommunityByInviteCode($inviteCode)) fail('该邀请码已存在');
    $community = [
        'id' => uid('c_'),
        'name' => trim((string)($name ?: $inviteCode)) ?: $inviteCode,
        'inviteCode' => $inviteCode,
        'createdAt' => now()
    ];
    $GLOBALS['COMMUNITIES'][] = $community;
    saveCommunities();
    ok(['community' => $community]);
}

if ($method === 'PUT' && matchRoute('communities/:id', $uri, $params)) {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $idx = findCommunityIndexById($params['id']);
    if ($idx < 0) fail('社区不存在');
    foreach ($body as $key => $val) {
        if ($key !== 'id') $GLOBALS['COMMUNITIES'][$idx][$key] = $val;
    }
    saveCommunities();
    ok(['community' => $GLOBALS['COMMUNITIES'][$idx]]);
}

if ($method === 'DELETE' && matchRoute('communities/:id', $uri, $params)) {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $idx = findCommunityIndexById($params['id']);
    if ($idx < 0) fail('社区不存在');
    array_splice($GLOBALS['COMMUNITIES'], $idx, 1);
    saveCommunities();
    ok();
}

if ($method === 'POST' && $uri === 'communities/bind') {
    $ctx = authMiddleware();
    $inviteCode = isset($body['inviteCode']) ? $body['inviteCode'] : '';
    $community = findCommunityByInviteCode($inviteCode);
    if (!$community) fail('邀请码不存在，请核对后重试');
    $idx = findUserIndexById($ctx['userId']);
    if ($idx < 0) fail('用户不存在');
    if ($GLOBALS['USERS'][$idx]['role'] === 'property') fail('物业账号不能修改邀请码');
    $GLOBALS['USERS'][$idx]['communityId'] = $community['id'];
    saveUsers();
    ok(['community' => $community]);
}

// ==================== 认证管理 ====================
if ($method === 'POST' && $uri === 'certification/submit') {
    $ctx = authMiddleware();
    $idx = findUserIndexById($ctx['userId']);
    if ($idx < 0) fail('账号不存在');
    $user = &$GLOBALS['USERS'][$idx];
    if ($user['role'] !== 'property' && $user['role'] !== 'restaurant') fail('该类型账号无需认证');
    $cert = isset($user['certification']) ? $user['certification'] : [];
    $cert['companyName'] = isset($body['companyName']) ? $body['companyName'] : '';
    $cert['contactName'] = isset($body['contactName']) ? $body['contactName'] : '';
    $cert['documents'] = isset($body['documents']) ? $body['documents'] : [];

    if ($user['role'] === 'property') {
        $inviteCode = trim((string)(isset($body['inviteCode']) ? $body['inviteCode'] : ''));
        if (!$inviteCode) fail('请填写社区邀请码');
        $other = false;
        foreach ($GLOBALS['USERS'] as $u) {
            if ($u['id'] !== $user['id'] && $u['role'] === 'property' && isset($u['certification']['inviteCode']) && $u['certification']['inviteCode'] === $inviteCode) {
                $other = true; break;
            }
        }
        if ($other) fail('该邀请码已被其他物业使用，请更换');
        if (!findCommunityByInviteCode($inviteCode)) {
            $GLOBALS['COMMUNITIES'][] = [
                'id' => uid('c_'),
                'name' => (isset($cert['companyName']) ? $cert['companyName'] : '') ?: $inviteCode,
                'inviteCode' => $inviteCode,
                'createdAt' => now()
            ];
            saveCommunities();
        }
        $cert['inviteCode'] = $inviteCode;
    }

    if ($user['role'] === 'restaurant' && isset($body['restaurantData'])) {
        $cert['restaurantData'] = $body['restaurantData'];
    }
    $cert['status'] = 'pending';
    $cert['submittedAt'] = now();
    $cert['reviewNote'] = '';
    $cert['reviewedAt'] = 0;
    $user['certification'] = $cert;
    $user['status'] = 'pending_cert';
    saveUsers();
    ok();
}

if ($method === 'GET' && $uri === 'certifications') {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $role = isset($_GET['role']) ? $_GET['role'] : '';
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $list = arrayFilter($GLOBALS['USERS'], function($u) { return $u['role'] === 'property' || $u['role'] === 'restaurant'; });
    if ($role) $list = arrayFilter($list, function($u) use ($role) { return $u['role'] === $role; });
    if ($status) $list = arrayFilter($list, function($u) use ($status) { return isset($u['certification']['status']) && $u['certification']['status'] === $status; });
    usort($list, function($a, $b) {
        $sa = isset($a['certification']['submittedAt']) ? $a['certification']['submittedAt'] : 0;
        $sb = isset($b['certification']['submittedAt']) ? $b['certification']['submittedAt'] : 0;
        return $sb <=> $sa;
    });
    ok(['list' => $list, 'total' => count($list)]);
}

if ($method === 'POST' && matchRoute('certifications/:userId/review', $uri, $params)) {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $idx = findUserIndexById($params['userId']);
    if ($idx < 0) fail('用户不存在');
    $user = &$GLOBALS['USERS'][$idx];
    if ($user['role'] !== 'property' && $user['role'] !== 'restaurant') fail('该账号类型无需审核');
    $approve = isset($body['approve']) ? (bool)$body['approve'] : false;
    $reviewNote = isset($body['reviewNote']) ? $body['reviewNote'] : '';
    $cert = isset($user['certification']) ? $user['certification'] : [];
    $cert['status'] = $approve ? 'approved' : 'rejected';
    $cert['reviewNote'] = $reviewNote;
    $cert['reviewedAt'] = now();
    $user['certification'] = $cert;
    $user['status'] = $approve ? 'active' : 'pending_cert';
    if ($user['role'] === 'property' && $approve && isset($cert['inviteCode'])) {
        $community = findCommunityByInviteCode($cert['inviteCode']);
        if ($community) $user['communityId'] = $community['id'];
    }
    saveUsers();
    ok();
}

// ==================== 公告管理 ====================
if ($method === 'GET' && $uri === 'announcements') {
    $communityId = isset($_GET['communityId']) ? $_GET['communityId'] : '';
    $list = $GLOBALS['ANNOUNCEMENTS'];
    usort($list, function($a, $b) { return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
    if ($communityId) $list = arrayFilter($list, function($a) use ($communityId) { return isset($a['communityId']) && $a['communityId'] === $communityId; });
    ok(['list' => $list, 'total' => count($list)]);
}

if ($method === 'POST' && $uri === 'announcements') {
    $ctx = authMiddleware();
    $title = isset($body['title']) ? trim((string)$body['title']) : '';
    $content = isset($body['content']) ? trim((string)$body['content']) : '';
    $communityId = isset($body['communityId']) ? $body['communityId'] : '';
    if (!$title || !$content) fail('请填写标题和正文');
    $user = findUserById($ctx['userId']);
    $ann = [
        'id' => uid('ann_'),
        'title' => $title,
        'content' => $content,
        'authorId' => $ctx['userId'],
        'authorPhone' => $user ? $user['phone'] : '',
        'communityId' => $communityId,
        'createdAt' => now()
    ];
    array_unshift($GLOBALS['ANNOUNCEMENTS'], $ann);
    saveAnnouncements();
    ok(['announcement' => $ann]);
}

if ($method === 'DELETE' && matchRoute('announcements/:id', $uri, $params)) {
    $ctx = authMiddleware();
    $idx = findAnnouncementIndexById($params['id']);
    if ($idx < 0) fail('公告不存在');
    if ($ctx['userRole'] !== 'admin' && $GLOBALS['ANNOUNCEMENTS'][$idx]['authorId'] !== $ctx['userId']) fail('权限不足');
    array_splice($GLOBALS['ANNOUNCEMENTS'], $idx, 1);
    saveAnnouncements();
    ok();
}

// ==================== 设施管理 ====================
if ($method === 'GET' && $uri === 'facilities') {
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $district = isset($_GET['district']) ? $_GET['district'] : '';
    $street = isset($_GET['street']) ? $_GET['street'] : '';
    $list = $GLOBALS['FACILITIES'];
    usort($list, function($a, $b) { return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
    if ($category) $list = arrayFilter($list, function($f) use ($category) { return isset($f['category']) && $f['category'] === $category; });
    if ($district) $list = arrayFilter($list, function($f) use ($district) { return isset($f['district']) && $f['district'] === $district; });
    if ($street) $list = arrayFilter($list, function($f) use ($street) { return isset($f['street']) && $f['street'] === $street; });
    ok(['list' => $list, 'total' => count($list)]);
}

if ($method === 'POST' && $uri === 'facilities') {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $name = isset($body['name']) ? trim((string)$body['name']) : '';
    $category = isset($body['category']) ? trim((string)$body['category']) : '';
    $address = isset($body['address']) ? trim((string)$body['address']) : '';
    $district = isset($body['district']) ? trim((string)$body['district']) : '';
    $street = isset($body['street']) ? trim((string)$body['street']) : '';
    $distance = isset($body['distance']) ? (int)$body['distance'] : 0;
    if (!$name || !$category || !$district) fail('请填写设施名称、分类和所属区/县');
    $facility = [
        'id' => uid('f_'),
        'category' => $category,
        'name' => $name,
        'address' => $address,
        'district' => $district,
        'street' => $street,
        'distance' => $distance,
        'createdAt' => now()
    ];
    $GLOBALS['FACILITIES'][] = $facility;
    saveFacilities();
    ok(['facility' => $facility]);
}

if ($method === 'DELETE' && matchRoute('facilities/:id', $uri, $params)) {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $idx = findFacilityIndexById($params['id']);
    if ($idx < 0) fail('设施不存在');
    array_splice($GLOBALS['FACILITIES'], $idx, 1);
    saveFacilities();
    ok();
}

// ==================== 商品管理 ====================
if ($method === 'GET' && $uri === 'products') {
    $cat = isset($_GET['cat']) ? $_GET['cat'] : '';
    $keyword = isset($_GET['keyword']) ? strtolower((string)$_GET['keyword']) : '';
    $merchantId = isset($_GET['merchantId']) ? $_GET['merchantId'] : '';
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $list = arrayFilter($GLOBALS['PRODUCTS'], function($p) { return isset($p['status']) && $p['status'] === 'active'; });
    if ($status) $list = arrayFilter($GLOBALS['PRODUCTS'], function($p) use ($status) { return isset($p['status']) && $p['status'] === $status; });
    if ($cat && $cat !== 'all') $list = arrayFilter($list, function($p) use ($cat) { return isset($p['cat']) && $p['cat'] === $cat; });
    if ($keyword) $list = arrayFilter($list, function($p) use ($keyword) {
        return (isset($p['title']) && strpos(strtolower((string)$p['title']), $keyword) !== false) ||
               (isset($p['desc']) && strpos(strtolower((string)$p['desc']), $keyword) !== false);
    });
    if ($merchantId) $list = arrayFilter($list, function($p) use ($merchantId) { return isset($p['merchantId']) && $p['merchantId'] === $merchantId; });
    usort($list, function($a, $b) { return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
    ok(['list' => $list, 'total' => count($list)]);
}

if ($method === 'GET' && matchRoute('products/:id', $uri, $params)) {
    $p = findProductById($params['id']);
    if (!$p) fail('商品不存在');
    ok(['product' => $p]);
}

if ($method === 'POST' && $uri === 'products') {
    $ctx = authMiddleware();
    $title = isset($body['title']) ? trim((string)$body['title']) : '';
    $cat = isset($body['cat']) ? $body['cat'] : '';
    if (!$title || !$cat) fail('请填写标题和分类');
    $user = findUserById($ctx['userId']);
    $product = [
        'id' => uid('p_'),
        'title' => $title,
        'desc' => isset($body['desc']) ? trim((string)$body['desc']) : '',
        'price' => isset($body['price']) ? (float)$body['price'] : 0,
        'cat' => $cat,
        'photo' => isset($body['photo']) ? $body['photo'] : '',
        'merchantId' => isset($body['merchantId']) ? $body['merchantId'] : $ctx['userId'],
        'merchantName' => isset($body['merchantName']) ? $body['merchantName'] : ($user ? $user['phone'] : ''),
        'city' => isset($body['city']) ? $body['city'] : '',
        'district' => isset($body['district']) ? $body['district'] : '',
        'street' => isset($body['street']) ? $body['street'] : '',
        'address' => isset($body['address']) ? $body['address'] : '',
        'status' => 'active',
        'createdAt' => now(),
        'updatedAt' => now()
    ];
    array_unshift($GLOBALS['PRODUCTS'], $product);
    saveProducts();
    ok(['product' => $product]);
}

if ($method === 'PUT' && matchRoute('products/:id', $uri, $params)) {
    $ctx = authMiddleware();
    $idx = findProductIndexById($params['id']);
    if ($idx < 0) fail('商品不存在');
    if ($ctx['userRole'] !== 'admin' && $GLOBALS['PRODUCTS'][$idx]['merchantId'] !== $ctx['userId']) fail('权限不足');
    foreach ($body as $key => $val) {
        if ($key !== 'id') $GLOBALS['PRODUCTS'][$idx][$key] = $val;
    }
    $GLOBALS['PRODUCTS'][$idx]['updatedAt'] = now();
    saveProducts();
    ok(['product' => $GLOBALS['PRODUCTS'][$idx]]);
}

if ($method === 'DELETE' && matchRoute('products/:id', $uri, $params)) {
    $ctx = authMiddleware();
    $idx = findProductIndexById($params['id']);
    if ($idx < 0) fail('商品不存在');
    if ($ctx['userRole'] !== 'admin' && $GLOBALS['PRODUCTS'][$idx]['merchantId'] !== $ctx['userId']) fail('权限不足');
    array_splice($GLOBALS['PRODUCTS'], $idx, 1);
    saveProducts();
    ok();
}

// ==================== 订单管理 ====================
if ($method === 'GET' && $uri === 'orders') {
    $ctx = authMiddleware();
    $merchantId = isset($_GET['merchantId']) ? $_GET['merchantId'] : '';
    $buyerPhone = isset($_GET['buyerPhone']) ? $_GET['buyerPhone'] : '';
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $list = $GLOBALS['ORDERS'];
    if ($ctx['userRole'] !== 'admin') {
        $list = arrayFilter($list, function($o) use ($ctx) { return (isset($o['merchantId']) && $o['merchantId'] === $ctx['userId']) || (isset($o['buyerId']) && $o['buyerId'] === $ctx['userId']); });
    }
    if ($merchantId && $ctx['userRole'] === 'admin') $list = arrayFilter($list, function($o) use ($merchantId) { return isset($o['merchantId']) && $o['merchantId'] === $merchantId; });
    if ($buyerPhone) $list = arrayFilter($list, function($o) use ($buyerPhone) { return isset($o['buyerPhone']) && $o['buyerPhone'] === $buyerPhone; });
    if ($status) $list = arrayFilter($list, function($o) use ($status) { return isset($o['status']) && $o['status'] === $status; });
    usort($list, function($a, $b) { return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
    ok(['list' => $list, 'total' => count($list)]);
}

if ($method === 'GET' && matchRoute('orders/:id', $uri, $params)) {
    $ctx = authMiddleware();
    $o = findOrderById($params['id']);
    if (!$o) fail('订单不存在');
    if ($ctx['userRole'] !== 'admin' && (isset($o['merchantId']) && $o['merchantId'] !== $ctx['userId']) && (isset($o['buyerId']) && $o['buyerId'] !== $ctx['userId'])) fail('权限不足');
    ok(['order' => $o]);
}

if ($method === 'POST' && $uri === 'orders') {
    $productId = isset($body['productId']) ? $body['productId'] : '';
    $buyerName = isset($body['buyerName']) ? $body['buyerName'] : '';
    $buyerPhone = isset($body['buyerPhone']) ? $body['buyerPhone'] : '';
    $buyerAddress = isset($body['buyerAddress']) ? $body['buyerAddress'] : '';
    $payMethod = isset($body['payMethod']) ? $body['payMethod'] : 'wechat';
    $buyerId = isset($body['buyerId']) ? $body['buyerId'] : '';
    $product = findProductById($productId);
    if (!$product) fail('商品不存在');
    if (!isset($product['status']) || $product['status'] !== 'active') fail('商品已下架');
    $order = [
        'id' => uid('o_'),
        'orderNo' => 'ORD' . now() . mt_rand(1000, 9999),
        'productId' => $product['id'],
        'productTitle' => isset($product['title']) ? $product['title'] : '',
        'productPhoto' => isset($product['photo']) ? $product['photo'] : '',
        'price' => isset($product['price']) ? $product['price'] : 0,
        'payMethod' => $payMethod,
        'status' => 'pending',
        'buyerId' => $buyerId,
        'buyerName' => $buyerName,
        'buyerPhone' => $buyerPhone,
        'buyerAddress' => $buyerAddress,
        'merchantId' => isset($product['merchantId']) ? $product['merchantId'] : '',
        'merchantName' => isset($product['merchantName']) ? $product['merchantName'] : '',
        'createdAt' => now(),
        'paidAt' => 0,
        'tradeNo' => ''
    ];
    array_unshift($GLOBALS['ORDERS'], $order);
    saveOrders();
    ok(['order' => $order]);
}

// ==================== 支付相关 ====================
if ($method === 'POST' && $uri === 'pay/create') {
    $orderId = isset($body['orderId']) ? $body['orderId'] : '';
    $payMethod = isset($body['payMethod']) ? $body['payMethod'] : 'wechat';
    $order = findOrderById($orderId);
    if (!$order) fail('订单不存在');
    if (isset($order['status']) && $order['status'] === 'paid') fail('订单已支付');

    $qrCode = '';
    $payUrl = '';

    if (!empty($order['merchantId']) && isset($GLOBALS['MERCHANTS'][$order['merchantId']])) {
        $mc = $GLOBALS['MERCHANTS'][$order['merchantId']];
        if ($payMethod === 'wechat' && isset($mc['wechat']) && !empty($mc['wechat']['enabled'])) {
            $qrCode = isset($mc['wechat']['qrCode']) ? $mc['wechat']['qrCode'] : '';
        } elseif ($payMethod === 'alipay' && isset($mc['alipay']) && !empty($mc['alipay']['enabled'])) {
            $qrCode = isset($mc['alipay']['qrCode']) ? $mc['alipay']['qrCode'] : '';
        }
    }

    if (!$qrCode && isset($GLOBALS['PAY_CONFIG']['admin'])) {
        $admin = $GLOBALS['PAY_CONFIG']['admin'];
        if ($payMethod === 'wechat' && isset($admin['wechat']) && !empty($admin['wechat']['enabled'])) {
            $qrCode = isset($admin['wechat']['qrCode']) ? $admin['wechat']['qrCode'] : '';
            $payUrl = isset($admin['wechat']['payUrl']) ? $admin['wechat']['payUrl'] : '';
        } elseif ($payMethod === 'alipay' && isset($admin['alipay']) && !empty($admin['alipay']['enabled'])) {
            $qrCode = isset($admin['alipay']['qrCode']) ? $admin['alipay']['qrCode'] : '';
            $payUrl = isset($admin['alipay']['payUrl']) ? $admin['alipay']['payUrl'] : '';
        }
    }

    ok([
        'orderId' => $order['id'],
        'orderNo' => $order['orderNo'],
        'payMethod' => $payMethod,
        'amount' => $order['price'],
        'qrCode' => $qrCode,
        'payUrl' => $payUrl
    ]);
}

if ($method === 'POST' && $uri === 'pay/notify') {
    $orderNo = isset($body['orderNo']) ? $body['orderNo'] : '';
    $payMethod = isset($body['payMethod']) ? $body['payMethod'] : '';
    $tradeNo = isset($body['tradeNo']) ? $body['tradeNo'] : '';
    $order = findOrderByOrderNo($orderNo);
    if (!$order) fail('订单不存在');
    $idx = -1;
    foreach ($GLOBALS['ORDERS'] as $i => $o) {
        if ($o['orderNo'] === $orderNo) { $idx = $i; break; }
    }
    if (isset($GLOBALS['ORDERS'][$idx]['status']) && $GLOBALS['ORDERS'][$idx]['status'] === 'paid') ok(['order' => $GLOBALS['ORDERS'][$idx]]);
    $GLOBALS['ORDERS'][$idx]['status'] = 'paid';
    $GLOBALS['ORDERS'][$idx]['paidAt'] = now();
    $GLOBALS['ORDERS'][$idx]['tradeNo'] = $tradeNo;
    $GLOBALS['ORDERS'][$idx]['payMethod'] = $payMethod ?: $GLOBALS['ORDERS'][$idx]['payMethod'];
    saveOrders();
    ok(['order' => $GLOBALS['ORDERS'][$idx]]);
}

if ($method === 'POST' && $uri === 'pay/simulate') {
    $orderId = isset($body['orderId']) ? $body['orderId'] : '';
    $order = findOrderById($orderId);
    if (!$order) fail('订单不存在');
    $idx = -1;
    foreach ($GLOBALS['ORDERS'] as $i => $o) {
        if ($o['id'] === $orderId) { $idx = $i; break; }
    }
    if (isset($GLOBALS['ORDERS'][$idx]['status']) && $GLOBALS['ORDERS'][$idx]['status'] === 'paid') ok(['order' => $GLOBALS['ORDERS'][$idx]]);
    $GLOBALS['ORDERS'][$idx]['status'] = 'paid';
    $GLOBALS['ORDERS'][$idx]['paidAt'] = now();
    $GLOBALS['ORDERS'][$idx]['tradeNo'] = 'SIM' . now();
    saveOrders();
    ok(['order' => $GLOBALS['ORDERS'][$idx]]);
}

if ($method === 'GET' && $uri === 'pay/config') {
    $merchantId = isset($_GET['merchantId']) ? $_GET['merchantId'] : '';
    $config = null;
    if ($merchantId && isset($GLOBALS['MERCHANTS'][$merchantId])) {
        $config = $GLOBALS['MERCHANTS'][$merchantId];
    } else {
        $config = isset($GLOBALS['PAY_CONFIG']['admin']) ? $GLOBALS['PAY_CONFIG']['admin'] : [];
    }
    ok(['config' => $config]);
}

if ($method === 'POST' && $uri === 'admin/pay/config') {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    if (isset($body['wechat'])) {
        $GLOBALS['PAY_CONFIG']['admin']['wechat'] = array_merge($GLOBALS['PAY_CONFIG']['admin']['wechat'], $body['wechat']);
    }
    if (isset($body['alipay'])) {
        $GLOBALS['PAY_CONFIG']['admin']['alipay'] = array_merge($GLOBALS['PAY_CONFIG']['admin']['alipay'], $body['alipay']);
    }
    savePayConfig();
    ok(['config' => $GLOBALS['PAY_CONFIG']['admin']]);
}

if ($method === 'GET' && matchRoute('merchants/:id/pay', $uri, $params)) {
    $config = isset($GLOBALS['MERCHANTS'][$params['id']]) ? $GLOBALS['MERCHANTS'][$params['id']] : null;
    ok(['config' => $config]);
}

if ($method === 'POST' && matchRoute('merchants/:id/pay', $uri, $params)) {
    $ctx = authMiddleware();
    $mid = $params['id'];
    // 只允许本人或管理员修改收款配置
    if ($ctx['userRole'] !== 'admin' && $ctx['userId'] !== $mid) {
        fail('权限不足');
    }
    if (!isset($GLOBALS['MERCHANTS'][$mid])) {
        $GLOBALS['MERCHANTS'][$mid] = ['wechat' => ['enabled' => false, 'qrCode' => ''], 'alipay' => ['enabled' => false, 'qrCode' => '']];
    }
    if (isset($body['wechat'])) {
        $GLOBALS['MERCHANTS'][$mid]['wechat'] = array_merge($GLOBALS['MERCHANTS'][$mid]['wechat'], $body['wechat']);
    }
    if (isset($body['alipay'])) {
        $GLOBALS['MERCHANTS'][$mid]['alipay'] = array_merge($GLOBALS['MERCHANTS'][$mid]['alipay'], $body['alipay']);
    }
    saveMerchants();
    ok(['config' => $GLOBALS['MERCHANTS'][$mid]]);
}

// ==================== 管理员统计 ====================
if ($method === 'GET' && $uri === 'admin/stats') {
    $ctx = authMiddleware();
    requireRole($ctx, 'admin');
    $userCount = count(arrayFilter($GLOBALS['USERS'], function($u) { return isset($u['role']) && $u['role'] === 'user'; }));
    $propertyCount = count(arrayFilter($GLOBALS['USERS'], function($u) { return isset($u['role']) && $u['role'] === 'property'; }));
    $restaurantCount = count(arrayFilter($GLOBALS['USERS'], function($u) { return isset($u['role']) && $u['role'] === 'restaurant'; }));
    $certPending = count(arrayFilter($GLOBALS['USERS'], function($u) {
        return (isset($u['role']) && ($u['role'] === 'property' || $u['role'] === 'restaurant')) &&
               isset($u['certification']['status']) && $u['certification']['status'] === 'pending';
    }));
    $productCount = count(arrayFilter($GLOBALS['PRODUCTS'], function($p) { return isset($p['status']) && $p['status'] === 'active'; }));
    $orderCount = count($GLOBALS['ORDERS']);
    $paidCount = count(arrayFilter($GLOBALS['ORDERS'], function($o) { return isset($o['status']) && $o['status'] === 'paid'; }));
    $totalAmount = 0;
    foreach ($GLOBALS['ORDERS'] as $o) {
        if (isset($o['status']) && $o['status'] === 'paid') $totalAmount += ($o['price'] ?? 0);
    }
    $announcementCount = count($GLOBALS['ANNOUNCEMENTS']);
    $communityCount = count($GLOBALS['COMMUNITIES']);
    $merchantCount = count($GLOBALS['MERCHANTS']);
    ok(['stats' => compact('userCount', 'propertyCount', 'restaurantCount', 'certPending', 'productCount', 'orderCount', 'paidCount', 'totalAmount', 'announcementCount', 'communityCount', 'merchantCount')]);
}

// 未匹配任何路由
http_response_code(404);
jsonResponse(['ok' => false, 'reason' => '接口不存在']);
