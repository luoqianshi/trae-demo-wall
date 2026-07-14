;(function () {
  'use strict'

  // ==================== 工具函数 ====================

  /** 生成 UUID v4 */
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0
      var v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /** 生成工单号: RO + 年月日 + 6位序号 */
  function genOrderNo() {
    var d = new Date()
    var y = d.getFullYear()
    var m = String(d.getMonth() + 1).padStart(2, '0')
    var day = String(d.getDate()).padStart(2, '0')
    var seq = String(Math.floor(Math.random() * 900000) + 100000)
    return 'RO' + y + m + day + seq
  }

  /** 标准成功响应 */
  function ok(data) {
    return { code: 200, message: 'success', data: data }
  }

  /** 标准错误响应 */
  function fail(message, code) {
    return { code: code || 500, message: message || 'error', data: null }
  }

  /** 解析 query string 为对象 */
  function parseQuery(url) {
    var qs = url.split('?')[1] || ''
    var obj = {}
    if (!qs) return obj
    qs.split('&').forEach(function (pair) {
      var parts = pair.split('=')
      var key = decodeURIComponent(parts[0])
      var val = parts.length > 1 ? decodeURIComponent(parts[1]) : ''
      obj[key] = val
    })
    return obj
  }

  /** 解析 JSON body */
  function parseBody(bodyStr) {
    try {
      return JSON.parse(bodyStr)
    } catch (e) {
      return {}
    }
  }

  // ==================== 模拟数据 ====================

  /** 模拟会话存储 */
  var sessions = {}

  /** 种子工单数据 */
  var seedOrders = [
    {
      id: 'ORD202501010001',
      orderNo: 'RO20250101000001',
      status: 'completed',
      vehicleModel: '宝马 3系 2024款 325Li',
      plateNumber: '京A12345',
      mileage: 15000,
      customerName: '张先生',
      customerPhone: '138****8888',
      items: [
        { name: '机油更换', price: 580 },
        { name: '机滤更换', price: 120 },
        { name: '空调滤芯更换', price: 200 }
      ],
      totalAmount: 900,
      createTime: '2025-01-01 10:30:00',
      completeTime: '2025-01-01 14:20:00'
    }
  ]

  // ==================== 路由定义 ====================
  // 每条路由: { method, pattern: RegExp, handler: function(queryParams, body) }

  var routes = [
    // ---- 会话管理 ----
    {
      method: 'POST',
      pattern: /^\/api\/v1\/session(\?.*)?$/,
      handler: function (params, body) {
        var sid = uuid()
        sessions[sid] = {
          sessionId: sid,
          currentStep: 1,
          vehicleModel: '',
          plateNumber: '',
          mileage: 0,
          customerName: '',
          customerPhone: '',
          items: [],
          createTime: new Date().toISOString()
        }
        return ok({ sessionId: sid, currentStep: 1 })
      }
    },
    {
      method: 'GET',
      pattern: /^\/api\/v1\/session\/[0-9a-f\-]+(\?.*)?$/,
      handler: function (params, body) {
        // 从 URL 中提取 session id
        var urlParts = body._url.replace(/^\/api\/v1\/session\//, '').split('?')
        var sid = urlParts[0]
        if (sessions[sid]) {
          return ok(sessions[sid])
        }
        return ok({
          sessionId: sid,
          currentStep: 1,
          vehicleModel: '',
          plateNumber: '',
          mileage: 0,
          customerName: '',
          customerPhone: '',
          items: [],
          createTime: new Date().toISOString()
        })
      }
    },
    {
      method: 'PUT',
      pattern: /^\/api\/v1\/session\/[0-9a-f\-]+\/step(\?.*)?$/,
      handler: function (params, body) {
        var urlParts = body._url.replace(/^\/api\/v1\/session\//, '').split('?')
        var sid = urlParts[0].replace(/\/step$/, '')
        var step = body.step || body.currentStep || 2
        if (sessions[sid]) {
          sessions[sid].currentStep = step
          if (body.vehicleModel) sessions[sid].vehicleModel = body.vehicleModel
          if (body.plateNumber) sessions[sid].plateNumber = body.plateNumber
          if (body.mileage) sessions[sid].mileage = body.mileage
          if (body.customerName) sessions[sid].customerName = body.customerName
          if (body.customerPhone) sessions[sid].customerPhone = body.customerPhone
          if (body.items) sessions[sid].items = body.items
          return ok(sessions[sid])
        }
        return ok({ sessionId: sid, currentStep: step })
      }
    },

    // ---- 预检提交 ----
    {
      method: 'POST',
      pattern: /^\/api\/v1\/precheck\/submit(\?.*)?$/,
      handler: function (params, body) {
        return ok({ orderNo: genOrderNo(), status: 'submitted' })
      }
    },
    {
      method: 'POST',
      pattern: /^\/api\/v1\/precheck\/[0-9a-f\-]+\/submit(\?.*)?$/,
      handler: function (params, body) {
        return ok({ orderNo: genOrderNo(), status: 'submitted' })
      }
    },

    // ---- 工单管理 ----
    {
      method: 'GET',
      pattern: /^\/api\/v1\/orders(\?.*)?$/,
      handler: function (params, body) {
        return ok({
          list: seedOrders,
          total: seedOrders.length,
          page: 1,
          pageSize: 10
        })
      }
    },
    {
      method: 'GET',
      pattern: /^\/api\/v1\/orders\/[^\/?]+(\?.*)?$/,
      handler: function (params, body) {
        var urlParts = body._url.replace(/^\/api\/v1\/orders\//, '').split('?')
        var orderId = urlParts[0]
        var found = seedOrders.find(function (o) { return o.id === orderId || o.orderNo === orderId })
        if (found) {
          return ok(found)
        }
        // 返回一个基于 ID 的模拟工单
        return ok({
          id: orderId,
          orderNo: orderId.startsWith('RO') ? orderId : genOrderNo(),
          status: 'pending',
          vehicleModel: '模拟车辆 ' + orderId,
          plateNumber: '京B' + String(Math.floor(Math.random() * 90000) + 10000),
          mileage: Math.floor(Math.random() * 50000) + 5000,
          customerName: '模拟客户',
          customerPhone: '139****9999',
          items: [],
          totalAmount: 0,
          createTime: new Date().toISOString()
        })
      }
    },

    // ---- 集成状态 ----
    {
      method: 'GET',
      pattern: /^\/api\/v1\/integration\/status(\?.*)?$/,
      handler: function (params, body) {
        return ok({
          dms: { connected: true, name: 'DMS系统', version: '3.2.1', lastSync: new Date().toISOString() },
          crm: { connected: true, name: 'CRM系统', version: '2.1.0', lastSync: new Date().toISOString() }
        })
      }
    },

    // ---- 识别: 文字识别（自动判断车牌/里程） ----
    {
      method: 'POST',
      pattern: /^\/api\/v1\/recognize\/text(\?.*)?$/,
      handler: function (params, body) {
        var text = (body.text || body.imageText || '').trim()
        var plateReg = /^[\u4e00-\u9fa5]?[A-Z][A-Z0-9]{5,6}$/
        var mileageReg = /(\d{1,6}[\.,]?\d{0,3})\s*(?:km|公里)?$/i

        if (plateReg.test(text)) {
          return {
            type: 'plate',
            value: text,
            confidence: 0.95
          }
        }

        var mileageMatch = text.match(mileageReg)
        if (mileageMatch) {
          return {
            type: 'mileage',
            value: parseFloat(mileageMatch[1].replace(',', '.')),
            confidence: 0.90
          }
        }

        return {
          type: 'text',
          value: text,
          confidence: 0.8
        }
      }
    },

    // ---- 识别: 车牌识别 ----
    {
      method: 'POST',
      pattern: /^\/api\/v1\/recognize\/plate(\?.*)?$/,
      handler: function (params, body) {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
        var plate = '京A'
        for (var i = 0; i < 5; i++) {
          plate += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return {
          plate_no: plate,
          confidence: 0.92,
          is_existing_customer: true,
          brand: '大众',
          model: '帕萨特',
          color: '黑色'
        }
      }
    },

    // ---- 识别: 里程识别 ----
    {
      method: 'POST',
      pattern: /^\/api\/v1\/recognize\/mileage(\?.*)?$/,
      handler: function (params, body) {
        var mileage = Math.floor(Math.random() * 80001) + 5000
        return {
          mileage: mileage,
          confidence: 0.88
        }
      }
    },

    // ---- 识别: 外观检测 ----
    {
      method: 'POST',
      pattern: /^\/api\/v1\/recognize\/exterior(\?.*)?$/,
      handler: function (params, body) {
        var position = params.position || body.position || '0'
        var damageList = []

        if (position === '1') {
          damageList.push({
            position: 1,
            part_name: '前保险杠',
            damage_type: '划痕',
            severity_level: 1,
            confidence: 0.85 + Math.random() * 0.10
          })
        } else if (position === '3') {
          damageList.push({
            position: 3,
            part_name: '后保险杠',
            damage_type: '凹陷',
            severity_level: 2,
            confidence: 0.85 + Math.random() * 0.10
          })
        }

        return {
          damage_list: damageList,
          photo_urls: []
        }
      }
    },

    // ---- 识别: 维保推荐 ----
    {
      method: 'GET',
      pattern: /^\/api\/v1\/recognize\/recommend(\?.*)?$/,
      handler: function (params, body) {
        var mileage = parseInt(params.mileage, 10) || 0
        var items = []

        // 始终包含
        items.push({ itemName: '机油更换', itemDesc: '建议使用全合成机油', estimatedCost: 580, source: 1 })
        items.push({ itemName: '机油滤芯更换', itemDesc: '随机油同步更换', estimatedCost: 50, source: 1 })

        if (mileage >= 10000) {
          items.push({ itemName: '空气滤芯更换', itemDesc: '空气滤芯定期更换', estimatedCost: 120, source: 1 })
        }
        if (mileage >= 15000) {
          items.push({ itemName: '空调滤清器更换', itemDesc: '空调滤清器定期更换', estimatedCost: 150, source: 1 })
        }
        if (mileage >= 20000) {
          items.push({ itemName: '刹车油更换', itemDesc: '刹车油定期更换', estimatedCost: 280, source: 1 })
        }
        if (mileage >= 30000) {
          items.push({ itemName: '火花塞更换', itemDesc: '火花塞定期更换', estimatedCost: 400, source: 1 })
        }
        if (mileage >= 40000) {
          items.push({ itemName: '变速箱油更换', itemDesc: '变速箱油定期更换', estimatedCost: 600, source: 1 })
        }

        // 始终包含（无费用）
        items.push({ itemName: '刹车片检查', itemDesc: '检查刹车片磨损情况', estimatedCost: null, source: 1 })

        return {
          items: items
        }
      }
    },

    // ---- AI 文字识别 ----
    {
      method: 'POST',
      pattern: /^\/ai-api\/v1\/recognize\/text(\?.*)?$/,
      handler: function (params, body) {
        var text = (body.text || body.imageText || '').trim()
        var plateReg = /^[\u4e00-\u9fa5]?[A-Z][A-Z0-9]{5,6}$/
        var mileageReg = /(\d{1,6}[\.,]?\d{0,3})\s*(?:km|公里)?$/i

        if (plateReg.test(text)) {
          return ok({
            type: 'plate',
            value: text,
            confidence: 0.96 + Math.random() * 0.04,
            provider: 'ai-ocr'
          })
        }

        var mileageMatch = text.match(mileageReg)
        if (mileageMatch) {
          return ok({
            type: 'mileage',
            value: parseFloat(mileageMatch[1].replace(',', '.')),
            unit: 'km',
            confidence: 0.93 + Math.random() * 0.07,
            provider: 'ai-ocr'
          })
        }

        return ok({
          type: 'text',
          value: text,
          confidence: 0.85,
          provider: 'ai-ocr'
        })
      }
    },

    // ---- 健康检查 ----
    {
      method: 'GET',
      pattern: /^\/actuator\/health(\?.*)?$/,
      handler: function (params, body) {
        return { status: 'UP' }
      }
    }
  ]

  // ==================== 路由匹配 ====================

  /**
   * 根据请求方法和 URL 路径查找匹配的路由
   * @param {string} method - HTTP 方法
   * @param {string} url - 完整请求 URL（可能包含 query string）
   * @returns {{ route: object, queryParams: object, pathname: string } | null}
   */
  function matchRoute(method, url) {
    // 去掉 base URL 前缀，只保留路径部分
    var pathname = url
    try {
      // 如果是完整 URL，提取 pathname
      if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
        var parsed = new URL(url)
        pathname = parsed.pathname + parsed.search
      }
    } catch (e) {
      // 如果 URL 解析失败，直接使用原始值
    }

    // 确保有 query string 部分
    var hasQuery = pathname.indexOf('?') !== -1

    for (var i = 0; i < routes.length; i++) {
      var route = routes[i]
      if (route.method !== method.toUpperCase()) continue
      if (route.pattern.test(pathname)) {
        return {
          route: route,
          queryParams: hasQuery ? parseQuery(pathname) : {},
          pathname: pathname
        }
      }
    }

    return null
  }

  // ==================== 拦截 fetch ====================

  var originalFetch = window.fetch

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input.url || '')
    var method = 'GET'
    var bodyStr = ''

    if (init) {
      if (init.method) method = init.method.toUpperCase()
      if (init.body) bodyStr = typeof init.body === 'string' ? init.body : ''
    }

    var matched = matchRoute(method, url)

    if (matched) {
      var body = parseBody(bodyStr)
      // 对于带 query string 的 URL，设置 body._url
      if (matched.pathname.indexOf('?') !== -1) {
        body._url = matched.pathname
      }
      // 对于 GET 请求也解析 query string
      if (matched.pathname.indexOf('?') !== -1 || method === 'GET') {
        if (matched.pathname.indexOf('?') !== -1) {
          body._url = matched.pathname
        }
      }

      var result = matched.route.handler(matched.queryParams, body)
      var json = JSON.stringify(result)

      return Promise.resolve(new Response(json, {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }))
    }

    // 未匹配的路由，走原始 fetch
    return originalFetch.apply(this, arguments)
  }

  // ==================== 拦截 XMLHttpRequest ====================

  var OriginalXHR = window.XMLHttpRequest

  function MockXHR() {
    var xhr = new OriginalXHR()
    var _method = ''
    var _url = ''
    var _async = true
    var _matched = null
    var _bodyStr = ''

    // 拦截 open
    var originalOpen = xhr.open
    xhr.open = function (method, url, async) {
      _method = (method || 'GET').toUpperCase()
      _url = url || ''
      _async = async !== false
      _matched = matchRoute(_method, _url)
      return originalOpen.apply(xhr, arguments)
    }

    // 拦截 send
    var originalSend = xhr.send
    xhr.send = function (body) {
      if (_matched) {
        _bodyStr = body || ''
        var parsed = parseBody(_bodyStr)

        // 对于带 query string 的 URL，设置 body._url
        if (_url.indexOf('?') !== -1) {
          parsed._url = _url
        }

        var self = this
        // 模拟异步响应
        setTimeout(function () {
          var result = _matched.route.handler(_matched.queryParams, parsed)
          var json = JSON.stringify(result)

          // 定义只读属性
          Object.defineProperty(self, 'responseText', { value: json, writable: false })
          Object.defineProperty(self, 'response', { value: json, writable: false })
          Object.defineProperty(self, 'status', { value: 200, writable: false })
          Object.defineProperty(self, 'statusText', { value: 'OK', writable: false })
          Object.defineProperty(self, 'readyState', { value: 4, writable: false })

          self.getResponseHeader = function (name) {
            if (name.toLowerCase() === 'content-type') return 'application/json'
            return null
          }
          self.getAllResponseHeaders = function () {
            return 'content-type: application/json'
          }

          if (typeof self.onreadystatechange === 'function') {
            self.onreadystatechange()
          }
          if (typeof self.onload === 'function') {
            self.onload()
          }
          if (typeof self.onloadend === 'function') {
            self.onloadend()
          }
        }, _async ? 50 : 0)

        return
      }

      return originalSend.apply(xhr, arguments)
    }

    return xhr
  }

  // 继承原型链
  MockXHR.prototype = OriginalXHR.prototype
  MockXHR.UNSENT = 0
  MockXHR.OPENED = 1
  MockXHR.HEADERS_RECEIVED = 2
  MockXHR.LOADING = 3
  MockXHR.DONE = 4

  window.XMLHttpRequest = MockXHR

  // ==================== 日志 ====================
  console.log('[Mock API] 拦截器已加载，共注册 ' + routes.length + ' 条路由规则')
})()