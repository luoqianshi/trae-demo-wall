const crypto = require('crypto');

class DeviceFingerprint {
  constructor() {
    this.deviceMap = new Map();
    this.maxDevicesPerUser = 5;
    this.maxUsersPerDevice = 3;
    this.deviceInfoCache = new Map();
  }

  generateFingerprint(req) {
    const headers = req.headers;
    
    const fingerprintData = [
      headers['user-agent'] || '',
      headers['accept'] || '',
      headers['accept-language'] || '',
      headers['accept-encoding'] || '',
      headers['dnt'] || '',
      headers['sec-ch-ua'] || '',
      headers['sec-ch-ua-mobile'] || '',
      headers['sec-ch-ua-platform'] || '',
      req.ip || req.connection.remoteAddress || ''
    ];

    return crypto.createHash('sha256').update(fingerprintData.join('|')).digest('hex');
  }

  getDeviceInfo(fingerprint) {
    return this.deviceInfoCache.get(fingerprint) || null;
  }

  registerDevice(fingerprint, userId, userAgent = '') {
    let deviceInfo = this.deviceInfoCache.get(fingerprint);
    
    if (!deviceInfo) {
      deviceInfo = {
        fingerprint,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        userIds: new Set(),
        userAgents: new Set(),
        requestCount: 0,
        suspiciousScore: 0,
        isBlocked: false,
        blockReason: ''
      };
      this.deviceInfoCache.set(fingerprint, deviceInfo);
    }

    deviceInfo.lastSeen = Date.now();
    deviceInfo.userIds.add(userId);
    deviceInfo.userAgents.add(userAgent);
    deviceInfo.requestCount++;

    if (deviceInfo.userIds.size > this.maxUsersPerDevice) {
      deviceInfo.isBlocked = true;
      deviceInfo.blockReason = '同一设备登录过多账号';
      deviceInfo.suspiciousScore = 80;
    }

    this.analyzeDevice(deviceInfo);

    return deviceInfo;
  }

  analyzeDevice(deviceInfo) {
    let score = 0;

    if (deviceInfo.userIds.size >= 3) {
      score += 30;
    }
    
    if (deviceInfo.userAgents.size > 5) {
      score += 20;
    }
    
    if (deviceInfo.requestCount > 1000) {
      score += 30;
    }

    const commonBrowsers = [
      'Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'
    ];
    const hasCommonBrowser = [...deviceInfo.userAgents].some(ua =>
      commonBrowsers.some(browser => ua.includes(browser))
    );
    
    if (!hasCommonBrowser && deviceInfo.userAgents.size > 0) {
      score += 20;
    }

    deviceInfo.suspiciousScore = score;

    if (score >= 70 && !deviceInfo.isBlocked) {
      deviceInfo.isBlocked = true;
      deviceInfo.blockReason = '设备行为异常';
    }
  }

  validateDevice(fingerprint, userId) {
    const deviceInfo = this.deviceInfoCache.get(fingerprint);
    
    if (!deviceInfo) {
      return { valid: true, message: '新设备', suspiciousScore: 0 };
    }

    if (deviceInfo.isBlocked) {
      return { valid: false, message: deviceInfo.blockReason, suspiciousScore: deviceInfo.suspiciousScore };
    }

    if (!deviceInfo.userIds.has(userId)) {
      if (deviceInfo.userIds.size >= this.maxUsersPerDevice) {
        return { valid: false, message: '设备已绑定其他账号', suspiciousScore: 60 };
      }
      return { valid: true, message: '新用户使用此设备', suspiciousScore: 30 };
    }

    return { valid: true, message: '正常设备', suspiciousScore: deviceInfo.suspiciousScore };
  }

  getDeviceStats() {
    const totalDevices = this.deviceInfoCache.size;
    const blockedDevices = [...this.deviceInfoCache.values()].filter(d => d.isBlocked).length;
    const avgUsersPerDevice = [...this.deviceInfoCache.values()].reduce((sum, d) => sum + d.userIds.size, 0) / totalDevices || 0;
    
    return {
      totalDevices,
      blockedDevices,
      avgUsersPerDevice: Math.round(avgUsersPerDevice * 100) / 100,
      activeDevices: [...this.deviceInfoCache.values()]
        .filter(d => Date.now() - d.lastSeen < 3600000).length
    };
  }
}

class ProxyDetector {
  constructor() {
    this.proxyHeaders = [
      'x-forwarded-for',
      'x-forwarded',
      'forwarded-for',
      'forwarded',
      'x-real-ip',
      'x-client-ip',
      'x-originating-ip',
      'x-remote-addr',
      'x-proxy-user-ip',
      'via',
      'x-via',
      'x-cluster-client-ip'
    ];

    this.dataCenterIPs = new Set([
      '10.', '172.16.', '172.17.', '172.18.', '172.19.', 
      '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
      '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
      '172.30.', '172.31.', '192.168.', '100.64.', '169.254.'
    ]);

    this.vpnASNs = new Set([
      396982, 3215, 1239, 3356, 701, 174, 7922, 20940,
      15169, 36692, 37963, 19165, 35909, 4134, 4808,
      46606, 5384, 6079, 2828, 721, 286, 6830, 3257
    ]);

    this.proxyIPs = new Set();
  }

  detectProxy(req) {
    const result = {
      isProxy: false,
      isDataCenter: false,
      isVPN: false,
      proxyHeaders: [],
      suspiciousScore: 0
    };

    this.proxyHeaders.forEach(header => {
      const value = req.headers[header.toLowerCase()];
      if (value) {
        result.proxyHeaders.push(header);
        result.suspiciousScore += 10;
      }
    });

    const clientIP = this.getClientIP(req);
    if (clientIP) {
      if (this.isDataCenterIP(clientIP)) {
        result.isDataCenter = true;
        result.suspiciousScore += 30;
      }

      if (this.proxyIPs.has(clientIP)) {
        result.isProxy = true;
        result.suspiciousScore += 50;
      }
    }

    if (result.proxyHeaders.length >= 3) {
      result.isProxy = true;
      result.suspiciousScore += 20;
    }

    if (result.suspiciousScore >= 60) {
      result.isProxy = true;
    }

    return result;
  }

  getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  }

  isDataCenterIP(ip) {
    if (!ip) return false;
    
    const normalizedIP = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
    
    for (const prefix of this.dataCenterIPs) {
      if (normalizedIP.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }

  addProxyIP(ip) {
    this.proxyIPs.add(ip);
  }

  removeProxyIP(ip) {
    this.proxyIPs.delete(ip);
  }

  getProxyStats() {
    return {
      totalProxyIPs: this.proxyIPs.size,
      dataCenterIPCount: this.dataCenterIPs.size
    };
  }
}

const deviceFingerprint = new DeviceFingerprint();
const proxyDetector = new ProxyDetector();

module.exports = {
  DeviceFingerprint,
  ProxyDetector,
  deviceFingerprint,
  proxyDetector
};