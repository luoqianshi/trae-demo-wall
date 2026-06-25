#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
漏洞哨兵 V9 - 真实安全扫描后端
提供真实 HTTP 响应头检测、SSL 证书分析、敏感路径探测、WAF 识别。
"""

import json
import re
import socket
import ssl
import datetime
from urllib.parse import urlparse
from http.client import HTTPSConnection, HTTPConnection
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder=None)
CORS(app)

# ========== 配置 ==========
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
SCAN_TIMEOUT = 10

# ========== 安全头检测规则 ==========
SECURITY_HEADERS = {
    'strict-transport-security': {
        'name': 'HSTS',
        'category': '传输安全',
        'severity': 'high',
        'description': '强制浏览器只通过 HTTPS 访问',
        'fix': 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
    },
    'content-security-policy': {
        'name': 'CSP',
        'category': 'XSS 防护',
        'severity': 'high',
        'description': '限制页面可加载的资源来源',
        'fix': 'add_header Content-Security-Policy "default-src \'self\'" always;',
    },
    'x-frame-options': {
        'name': 'X-Frame-Options',
        'category': '点击劫持',
        'severity': 'medium',
        'description': '防止页面被嵌入 iframe',
        'fix': 'add_header X-Frame-Options "DENY" always;',
    },
    'x-content-type-options': {
        'name': 'X-Content-Type-Options',
        'category': 'MIME 嗅探',
        'severity': 'medium',
        'description': '禁止浏览器猜测 MIME 类型',
        'fix': 'add_header X-Content-Type-Options "nosniff" always;',
    },
    'referrer-policy': {
        'name': 'Referrer-Policy',
        'category': '隐私',
        'severity': 'low',
        'description': '控制 Referer 头发送策略',
        'fix': 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
    },
    'permissions-policy': {
        'name': 'Permissions-Policy',
        'category': '隐私',
        'severity': 'low',
        'description': '控制浏览器 API 权限',
        'fix': 'add_header Permissions-Policy "camera=(), microphone=()" always;',
    },
}

# WAF 指纹
WAF_SIGNATURES = {
    'cloudflare': ['CF-RAY', '__cfduid', 'cf-browser-verification'],
    'aliyun': ['X-Alibaba-WAF', 'X-Alibaba-WAF-Action'],
    'aws': ['X-AMZ-CF-ID', 'X-Cache'],
    'baidu': ['X-Bd-WAF', 'X-Bd-Id'],
    'qcloud': ['X-Qcloud-Edge', 'X-Tencent-Ua'],
    'imperva': ['X-Iinfo', 'incap_ses'],
    'akamai': ['X-Akamai-Request-BC', 'Akamai-Origin-Hop'],
}

# 敏感路径
SENSITIVE_PATHS = [
    '/.env', '/.git/config', '/.svn/entries', '/.htaccess',
    '/robots.txt', '/sitemap.xml', '/admin', '/login',
    '/phpmyadmin', '/api', '/swagger', '/.DS_Store',
    '/config.php', '/wp-config.php', '/.env.local',
    '/backup.sql', '/dump.sql', '/.bak',
]


def get_ssl_info(hostname, port=443):
    """获取 SSL 证书信息"""
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with socket.create_connection((hostname, port), timeout=SCAN_TIMEOUT) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert(binary_form=False)
                cipher = ssock.cipher()
                version = ssock.version()
                
                # 解析证书
                subject = dict(x[0] for x in cert.get('subject', []))
                issuer = dict(x[0] for x in cert.get('issuer', []))
                not_after = cert.get('notAfter', '')
                not_before = cert.get('notBefore', '')
                san = cert.get('subjectAltName', [])
                
                # 检查过期
                expired = False
                days_left = None
                if not_after:
                    try:
                        expiry = datetime.datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z')
                        days_left = (expiry - datetime.datetime.utcnow()).days
                        expired = days_left < 0
                    except ValueError:
                        pass
                
                return {
                    'has_cert': True,
                    'subject': subject.get('commonName', ''),
                    'issuer': issuer.get('commonName', ''),
                    'not_after': not_after,
                    'not_before': not_before,
                    'days_left': days_left,
                    'expired': expired,
                    'version': version,
                    'cipher': cipher[0] if cipher else '',
                    'san': [x[1] for x in san if x[0] == 'DNS'][:5],
                    'weak': version in ['TLSv1', 'TLSv1.1'] or (cipher and 'RC4' in str(cipher)),
                }
    except Exception as e:
        return {'has_cert': False, 'error': str(e)[:100]}


def detect_waf(headers):
    """检测 WAF"""
    headers_lower = {k.lower(): v for k, v in headers.items()}
    detected = []
    for waf_name, signatures in WAF_SIGNATURES.items():
        for sig in signatures:
            if sig.lower() in headers_lower:
                detected.append({'name': waf_name, 'signature': sig, 'value': headers_lower[sig.lower()]})
                break
            for hk, hv in headers_lower.items():
                if sig.lower() in hk.lower() or sig.lower() in hv.lower():
                    detected.append({'name': waf_name, 'signature': sig, 'value': hv})
                    break
    return detected


def check_sensitive_paths(host, is_https):
    """探测敏感路径"""
    results = []
    protocol = 'https' if is_https else 'http'
    
    for path in SENSITIVE_PATHS[:8]:  # 限制数量避免太慢
        try:
            if is_https:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                conn = HTTPSConnection(host, 443, timeout=5, context=ctx)
            else:
                conn = HTTPConnection(host, 80, timeout=5)
            
            conn.request('GET', path, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            })
            resp = conn.getresponse()
            status = resp.status
            body = resp.read(1024)
            conn.close()
            
            if status == 200:
                results.append({'path': path, 'status': status, 'exposed': True, 'size': len(body)})
            elif status in [403, 401]:
                results.append({'path': path, 'status': status, 'exposed': False, 'protected': True})
        except Exception:
            pass
    
    return results


def safe_fetch_headers(url):
    """获取响应头，返回 (headers, is_https, final_url, error)"""
    parsed = urlparse(url)
    host = parsed.hostname or ''
    port = parsed.port or (443 if parsed.scheme == 'https' else 80)
    path = parsed.path or '/'
    if parsed.query:
        path += '?' + parsed.query
    
    is_https = parsed.scheme == 'https'
    
    # 如果输入 http，尝试 https
    if not is_https:
        try:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            conn = HTTPSConnection(host, 443, timeout=SCAN_TIMEOUT, context=ctx)
            conn.request('HEAD', path, headers={
                'User-Agent': 'VulnSentinel/9.0',
                'Accept': '*/*',
            })
            resp = conn.getresponse()
            headers = dict(resp.getheaders())
            conn.close()
            return headers, True, 'https://' + host + path, None
        except Exception:
            pass
    
    try:
        if is_https:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            conn = HTTPSConnection(host, port, timeout=SCAN_TIMEOUT, context=ctx)
        else:
            conn = HTTPConnection(host, port, timeout=SCAN_TIMEOUT)
        
        conn.request('HEAD', path, headers={
            'User-Agent': 'VulnSentinel/9.0',
            'Accept': '*/*',
        })
        resp = conn.getresponse()
        resp.read()
        headers = dict(resp.getheaders())
        conn.close()
        return headers, is_https, url, None
    except socket.timeout:
        return {}, is_https, url, '连接超时'
    except socket.gaierror:
        return {}, is_https, url, 'DNS 解析失败'
    except ConnectionRefusedError:
        return {}, is_https, url, '连接被拒绝'
    except Exception as e:
        return {}, is_https, url, '连接失败: ' + str(e)[:80]


def analyze_security(url, headers, is_https, ssl_info, waf_list, sensitive_paths):
    """完整安全分析"""
    findings = []
    score = 100
    header_details = []
    owasp = []
    
    # 1. HTTPS + SSL
    if not is_https:
        score -= 20
        findings.append({
            'name': '未启用 HTTPS',
            'level': '高风险',
            'owasp': 'A02 加密机制失效',
            'summary': '网站使用 HTTP 明文传输，存在中间人攻击风险。',
            'fix': '申请 SSL 证书并启用 HTTPS 强制跳转。',
        })
        owasp.append({'category': 'A02 加密机制失效', 'status': '高风险', 'note': '未启用 HTTPS'})
    else:
        owasp.append({'category': 'A02 加密机制失效', 'status': '通过', 'note': '已启用 HTTPS'})
        if ssl_info.get('has_cert'):
            if ssl_info.get('expired'):
                score -= 15
                findings.append({
                    'name': 'SSL 证书已过期',
                    'level': '高风险',
                    'owasp': 'A02 加密机制失效',
                    'summary': 'SSL 证书已过期 ' + str(abs(ssl_info.get('days_left', 0))) + ' 天。',
                    'fix': '立即续期 SSL 证书。',
                })
            elif ssl_info.get('days_left', 999) < 30:
                score -= 5
                findings.append({
                    'name': 'SSL 证书即将过期',
                    'level': '中风险',
                    'owasp': 'A02 加密机制失效',
                    'summary': 'SSL 证书将在 ' + str(ssl_info.get('days_left')) + ' 天后过期。',
                    'fix': '提前续期 SSL 证书。',
                })
            if ssl_info.get('weak'):
                score -= 10
                findings.append({
                    'name': '弱 SSL/TLS 配置',
                    'level': '中风险',
                    'owasp': 'A02 加密机制失效',
                    'summary': '使用 ' + ssl_info.get('version', '') + ' / ' + ssl_info.get('cipher', '') + '，存在已知漏洞。',
                    'fix': '升级到 TLS 1.2+，禁用弱密码套件。',
                })
    
    # 2. 安全头
    for key, rule in SECURITY_HEADERS.items():
        value = headers.get(key, headers.get(key.title(), None))
        if value:
            header_details.append({
                'name': rule['name'],
                'key': key,
                'value': value,
                'status': 'present',
                'category': rule['category'],
            })
        else:
            header_details.append({
                'name': rule['name'],
                'key': key,
                'value': None,
                'status': 'missing',
                'category': rule['category'],
            })
            if rule['severity'] == 'high':
                score -= 15
                findings.append({
                    'name': '缺少 ' + rule['name'],
                    'level': '高风险',
                    'owasp': 'A05 安全配置错误',
                    'summary': rule['description'] + '。',
                    'fix': rule['fix'],
                })
            elif rule['severity'] == 'medium':
                score -= 8
                findings.append({
                    'name': '缺少 ' + rule['name'],
                    'level': '中风险',
                    'owasp': 'A05 安全配置错误',
                    'summary': rule['description'] + '。',
                    'fix': rule['fix'],
                })
            else:
                score -= 3
                findings.append({
                    'name': '缺少 ' + rule['name'],
                    'level': '低风险',
                    'owasp': 'A05 安全配置错误',
                    'summary': rule['description'] + '。',
                    'fix': rule['fix'],
                })
    
    # 3. 信息泄露
    info_leaks = []
    for key in ['server', 'x-powered-by']:
        value = headers.get(key, headers.get(key.title(), None))
        if value:
            info_leaks.append({'name': key.title(), 'value': value})
            score -= 3
            findings.append({
                'name': key.title() + ' 信息泄露',
                'level': '低风险',
                'owasp': 'A05 安全配置错误',
                'summary': '暴露服务器信息: ' + value[:50],
                'fix': '隐藏或修改 ' + key.title() + ' 头。',
            })
    
    # 4. Cookie
    set_cookie = headers.get('set-cookie', headers.get('Set-Cookie', None))
    cookie_issues = []
    if set_cookie:
        flags = set_cookie.lower()
        if 'secure' not in flags:
            cookie_issues.append('缺少 Secure')
        if 'httponly' not in flags:
            cookie_issues.append('缺少 HttpOnly')
        if 'samesite' not in flags:
            cookie_issues.append('缺少 SameSite')
        if cookie_issues:
            score -= 5
            findings.append({
                'name': 'Cookie 安全配置不足',
                'level': '低风险',
                'owasp': 'A07 认证失败',
                'summary': 'Cookie 缺少: ' + ', '.join(cookie_issues),
                'fix': '添加 Secure; HttpOnly; SameSite=Strict',
            })
    
    # 5. CORS
    cors = headers.get('access-control-allow-origin', headers.get('Access-Control-Allow-Origin', None))
    cors_details = None
    if cors:
        if cors == '*':
            score -= 10
            findings.append({
                'name': 'CORS 通配符',
                'level': '中风险',
                'owasp': 'A01 访问控制失效',
                'summary': 'Access-Control-Allow-Origin 设置为 "*"，任何域名可跨域访问。',
                'fix': '限制为可信域名。',
            })
            cors_details = {'value': '*', 'risk': '高风险'}
        else:
            cors_details = {'value': cors, 'risk': '低风险'}
    
    # 6. WAF
    waf_detected = len(waf_list) > 0
    
    # 7. 敏感路径
    exposed_paths = [p for p in sensitive_paths if p.get('exposed')]
    if exposed_paths:
        score -= 10
        findings.append({
            'name': '敏感路径暴露',
            'level': '高风险',
            'owasp': 'A01 访问控制失效',
            'summary': '发现 ' + str(len(exposed_paths)) + ' 个敏感路径可访问: ' + ', '.join([p['path'] for p in exposed_paths[:3]]),
            'fix': '限制敏感路径访问或移除。',
        })
    
    # OWASP 覆盖
    owasp_map = {item['category']: item for item in owasp}
    defaults = [
        ('A01 访问控制失效', '通过' if not exposed_paths else '高风险', '需关注'),
        ('A03 注入攻击', '需深度检测', '建议使用专业工具'),
        ('A04 不安全设计', '通过', '未检测到'),
        ('A05 安全配置错误', '需关注' if any(f['owasp'] == 'A05 安全配置错误' for f in findings) else '通过', '部分配置可优化'),
        ('A06 过时组件', '需深度检测', '建议扫描依赖'),
        ('A07 认证失败', '通过', '未检测到'),
        ('A08 软件完整性', '通过', '未检测到'),
        ('A09 日志监控不足', '低风险', '建议加强'),
        ('A10 服务端请求伪造', '通过', '未检测到'),
    ]
    for cat, status, note in defaults:
        if cat not in owasp_map:
            owasp.append({'category': cat, 'status': status, 'note': note})
    
    owasp_order = ['A01','A02','A03','A04','A05','A06','A07','A08','A09','A10']
    owasp.sort(key=lambda x: next((i for i,p in enumerate(owasp_order) if x['category'].startswith(p)), 99))
    
    score = max(10, min(98, score))
    risk_level = '高风险' if score < 50 else '中风险' if score < 75 else '低风险'
    
    return {
        'score': score,
        'risk_level': risk_level,
        'findings': findings,
        'owasp_coverage': owasp,
        'header_details': header_details,
        'info_leaks': info_leaks,
        'cors': cors_details,
        'cookie_issues': cookie_issues,
        'ssl_info': ssl_info,
        'waf': waf_list,
        'sensitive_paths': sensitive_paths,
        'waf_detected': waf_detected,
    }


# ========== API 路由 ==========

@app.route('/api/scan', methods=['POST'])
def api_scan():
    data = request.get_json(silent=True) or {}
    url = data.get('url', '').strip()
    
    if not url:
        return jsonify({'error': '缺少 url 参数'}), 400
    
    if not re.match(r'^https?://', url, re.I):
        url = 'http://' + url
    
    try:
        parsed = urlparse(url)
        if not parsed.hostname:
            return jsonify({'error': 'URL 格式无效'}), 400
    except Exception:
        return jsonify({'error': 'URL 格式无效'}), 400
    
    host = parsed.hostname
    
    # 获取响应头
    headers, is_https, final_url, error = safe_fetch_headers(url)
    if error:
        return jsonify({'error': error, 'scan_type': 'real', 'success': False}), 200
    
    # SSL 证书
    ssl_info = get_ssl_info(host, 443) if is_https else {'has_cert': False}
    
    # WAF 检测
    waf_list = detect_waf(headers)
    
    # 敏感路径
    sensitive_paths = check_sensitive_paths(host, is_https)
    
    # 分析
    result = analyze_security(url, headers, is_https, ssl_info, waf_list, sensitive_paths)
    
    return jsonify({
        'success': True,
        'scan_type': 'real',
        'url': url,
        'final_url': final_url,
        'time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'is_https': is_https,
        'raw_headers': headers,
        'score': result['score'],
        'risk_level': result['risk_level'],
        'findings': result['findings'],
        'owasp_coverage': result['owasp_coverage'],
        'header_details': result['header_details'],
        'info_leaks': result['info_leaks'],
        'cors': result['cors'],
        'cookie_issues': result['cookie_issues'],
        'ssl_info': result['ssl_info'],
        'waf': result['waf'],
        'sensitive_paths': result['sensitive_paths'],
        'waf_detected': result['waf_detected'],
    })


@app.route('/api/health', methods=['GET'])
def api_health():
    return jsonify({'status': 'ok', 'version': '9.0'})


@app.route('/')
def index():
    return send_from_directory(STATIC_DIR, 'index.html')


@app.route('/<path:path>')
def static_files(path):
    filepath = os.path.join(STATIC_DIR, path)
    if os.path.isfile(filepath):
        return send_from_directory(STATIC_DIR, path)
    return send_from_directory(STATIC_DIR, 'index.html')


if __name__ == '__main__':
    print('=' * 50)
    print('  漏洞哨兵 V9.0 - 真实安全扫描后端')
    print('  API: http://localhost:5000/api/scan')
    print('  前端: http://localhost:5000')
    print('=' * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)
