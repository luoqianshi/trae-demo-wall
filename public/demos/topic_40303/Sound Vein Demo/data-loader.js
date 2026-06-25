/**
 * data-loader.js —— 声脉APP 数据加载器
 * 负责加载前端静态配置和后端 API 数据
 *
 * 数据分类：
 *   1. 前端静态配置（data/*.json）：UI 布局、菜单、设置项、主题等
 *   2. 后端 API 数据（/api/*）：用户数据、家族成员、AI 模型、故事等
 *
 * 加载策略：
 *   - 静态配置通过 fetch() 加载 JSON 文件
 *   - 后端数据通过 fetch() 调用 RESTful API 接口
 *   - 添加时间戳缓存破坏参数，确保每次加载最新数据
 *   - fetch 超时（5秒）后报错
 *   - 加载失败时显示明确的错误提示和解决方案
 *   - 所有后端 API 数据成功返回后才触发前端展示
 *
 * 数据加载完成后，数据挂载到 window.AppData 全局对象，
 * 并调用 window.onAppDataReady() 回调。
 *
 * 后端 API 响应格式：
 *   { code: 0, message: "success", data: <业务数据>, timestamp: <毫秒> }
 *   code === 0 表示成功，非 0 表示失败
 */
(function(){
  'use strict';

  console.log('[data-loader] 初始化, readyState:', document.readyState, ', protocol:', window.location.protocol);

  // 前端静态配置文件清单
  var FRONTEND_SOURCES = {
    menus:     'data/menus.json',
    settings:  'data/settings.json',
    appConfig: 'data/app-config.json'
  };

  // 后端 API 端点定义（每个端点对应一类业务数据）
  var API_SOURCES = {
    familyMembers:        '/api/family-members',
    aiModels:             '/api/ai/models',
    chatHistory:          '/api/ai/chat-history',
    recentSummaries:      '/api/ai/recent-summaries',
    aiReplies:            '/api/ai/replies',
    stories:              '/api/stories',
    userProfile:          '/api/user/profile',
    userSecurity:         '/api/user/security',
    userPhone:            '/api/user/phone',
    userPrivacy:          '/api/user/privacy',
    userRecordingQuality: '/api/user/recording-quality',
    searchHotWords:       '/api/search/hot-words',
    homeStats:            '/api/stats/home'
  };

  window.AppData = {};

  // 缓存破坏时间戳
  var CACHE_BUSTER = '_t=' + Date.now();

  /**
   * 带超时的 fetch JSON（用于加载静态 JSON 文件）
   */
  function fetchJson(url, timeoutMs){
    timeoutMs = timeoutMs || 5000;
    var separator = url.indexOf('?') >= 0 ? '&' : '?';
    var fullUrl = url + separator + CACHE_BUSTER;

    return new Promise(function(resolve, reject){
      var settled = false;
      var timer = setTimeout(function(){
        if(!settled){
          settled = true;
          reject(new Error('请求超时 (' + timeoutMs + 'ms): ' + url));
        }
      }, timeoutMs);

      fetch(fullUrl, {cache: 'no-store'})
        .then(function(res){
          if(settled) return;
          if(!res.ok){
            settled = true;
            clearTimeout(timer);
            reject(new Error('HTTP ' + res.status + ': ' + url));
            return;
          }
          return res.json().then(function(data){
            if(settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(data);
          });
        })
        .catch(function(err){
          if(settled) return;
          settled = true;
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  /**
   * 带超时的 fetch API（用于调用后端 RESTful API）
   * 后端统一响应格式: { code: 0, message: "success", data: <业务数据> }
   * 成功时 resolve(data)，失败时 reject(Error)
   */
  function fetchApi(url, timeoutMs){
    timeoutMs = timeoutMs || 5000;
    var separator = url.indexOf('?') >= 0 ? '&' : '?';
    var fullUrl = url + separator + CACHE_BUSTER;

    return new Promise(function(resolve, reject){
      var settled = false;
      var timer = setTimeout(function(){
        if(!settled){
          settled = true;
          reject(new Error('请求超时 (' + timeoutMs + 'ms): ' + url));
        }
      }, timeoutMs);

      fetch(fullUrl, {cache: 'no-store'})
        .then(function(res){
          if(settled) return;
          if(!res.ok){
            settled = true;
            clearTimeout(timer);
            reject(new Error('HTTP ' + res.status + ': ' + url));
            return;
          }
          return res.json().then(function(body){
            if(settled) return;
            settled = true;
            clearTimeout(timer);
            // 检查业务状态码
            if(body && body.code === 0){
              resolve(body.data);
            } else {
              var msg = (body && body.message) ? body.message : '未知错误';
              var code = (body && body.code != null) ? body.code : -1;
              reject(new Error('API错误 [code=' + code + ']: ' + msg + ' (' + url + ')'));
            }
          });
        })
        .catch(function(err){
          if(settled) return;
          settled = true;
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  /**
   * 加载单个静态配置文件
   */
  function loadOne(key, url){
    return fetchJson(url, 5000)
      .then(function(data){
        console.log('[data-loader] ✓ 静态文件加载成功:', key);
        return {key: key, data: data, source: 'fetch'};
      })
      .catch(function(err){
        console.error('[data-loader] ✗ 静态文件加载失败:', key, err.message);
        return {key: key, data: null, source: 'error', error: err};
      });
  }

  /**
   * 加载单个后端 API 接口
   */
  function loadOneApi(key, url){
    return fetchApi(url, 5000)
      .then(function(data){
        console.log('[data-loader] ✓ API 加载成功:', key, '←', url);
        return {key: key, data: data, source: 'api'};
      })
      .catch(function(err){
        console.error('[data-loader] ✗ API 加载失败:', key, '←', url, '|', err.message);
        return {key: key, data: null, source: 'error', error: err};
      });
  }

  /**
   * 将后端 API 返回的分项数据重组为 backendMock 结构，
   * 以便 parseBackendMockData() 能沿用原有逻辑统一处理。
   */
  function reconstructBackendMock(){
    window.AppData.backendMock = {
      familyMembers: window.AppData.familyMembers || {},
      ai: {
        models:          window.AppData.aiModels || [],
        chatHistory:     window.AppData.chatHistory || {},
        recentSummaries: window.AppData.recentSummaries || [],
        replies:         window.AppData.aiReplies || {}
      },
      stories: window.AppData.stories || [],
      user: {
        profile:          window.AppData.userProfile || {},
        security:         window.AppData.userSecurity || {},
        phone:            window.AppData.userPhone || {},
        privacy:          window.AppData.userPrivacy || {},
        recordingQuality: window.AppData.userRecordingQuality || {}
      },
      search: {
        hotWords: window.AppData.searchHotWords || []
      },
      stats: {
        home: window.AppData.homeStats || []
      }
    };
    console.log('[data-loader] backendMock 已从 API 数据重组完成');
  }

  /**
   * 加载所有数据源（前端静态配置 + 后端 API）
   */
  function loadAll(){
    console.log('[data-loader] 开始加载所有数据源...');

    // 前端静态配置请求
    var frontendPromises = Object.keys(FRONTEND_SOURCES).map(function(k){
      return loadOne(k, FRONTEND_SOURCES[k]);
    });

    // 后端 API 请求
    var apiPromises = Object.keys(API_SOURCES).map(function(k){
      return loadOneApi(k, API_SOURCES[k]);
    });

    var allPromises = frontendPromises.concat(apiPromises);
    var totalKeys = allPromises.length;

    Promise.all(allPromises).then(function(results){
      var errors = [];
      var successCount = 0;
      var sources = {};

      results.forEach(function(r){
        window.AppData[r.key] = r.data;
        sources[r.key] = r.source;
        if(r.source === 'error'){
          errors.push(r.key);
        }else{
          successCount++;
        }
      });

      console.log('[data-loader] 加载完成: ' + successCount + '/' + totalKeys + ' 成功, 来源:', sources);

      // 全部失败 → 显示错误提示
      if(errors.length === totalKeys){
        console.error('[data-loader] 所有数据加载失败');
        showLoadError(errors);
        return;
      }

      // 后端 API 全部失败 → 显示错误提示（前端无法正常工作）
      var apiErrors = errors.filter(function(k){
        return k in API_SOURCES;
      });
      if(apiErrors.length === Object.keys(API_SOURCES).length){
        console.error('[data-loader] 所有后端 API 加载失败');
        showLoadError(apiErrors);
        return;
      }

      // 部分失败 → 警告
      if(errors.length > 0){
        console.warn('[data-loader] 部分数据加载失败:', errors.join(', '));
        showPartialError(errors);
      }

      // 将 API 分项数据重组为 backendMock 结构
      reconstructBackendMock();

      // 解析后端数据，派生常用别名
      parseBackendMockData();

      console.log('[data-loader] AppData 已就绪, 调用 onAppDataReady');

      // 通知主程序数据已就绪
      if(typeof window.onAppDataReady === 'function'){
        try{
          window.onAppDataReady();
          console.log('[data-loader] onAppDataReady 调用成功');
        }catch(e){
          console.error('[data-loader] onAppDataReady 执行出错:', e);
        }
      }else{
        console.warn('[data-loader] onAppDataReady 未定义，延迟重试...');
        var retryCount = 0;
        var retryTimer = setInterval(function(){
          retryCount++;
          if(typeof window.onAppDataReady === 'function'){
            clearInterval(retryTimer);
            try{
              window.onAppDataReady();
              console.log('[data-loader] onAppDataReady 延迟调用成功');
            }catch(e){
              console.error('[data-loader] onAppDataReady 延迟执行出错:', e);
            }
          }else if(retryCount > 30){
            clearInterval(retryTimer);
            console.error('[data-loader] onAppDataReady 在 3 秒内仍未定义，放弃');
          }
        }, 100);
      }
    }).catch(function(err){
      console.error('[data-loader] 加载过程异常:', err);
      var allKeys = Object.keys(FRONTEND_SOURCES).concat(Object.keys(API_SOURCES));
      showLoadError(allKeys);
    });
  }

  /**
   * 解析后端 Mock 数据，派生常用别名（保持与原 var 声明兼容）
   */
  function parseBackendMockData(){
    var mock = window.AppData.backendMock;
    if(!mock){
      console.warn('[data-loader] backendMock 数据不存在');
      return;
    }

    // 家族成员数据
    window.AppData.familyMembers = mock.familyMembers || {};

    // AI 相关数据
    if(mock.ai){
      window.AppData.aiModels       = mock.ai.models || [];
      window.AppData.chatHistory     = mock.ai.chatHistory || {};
      window.AppData.recentSummaries = mock.ai.recentSummaries || [];
      window.AppData.aiReplies       = mock.ai.replies || {};
    }

    // 故事馆数据
    window.AppData.stories = mock.stories || [];

    // 用户数据（合并到 settings 中）
    if(mock.user && window.AppData.settings){
      var settings = window.AppData.settings;
      if(!settings.pages) settings.pages = {};

      // 合并用户数据到设置页面
      if(mock.user.profile)  settings.pages.profile  = mock.user.profile;
      if(mock.user.security) settings.pages.security = mock.user.security;
      if(mock.user.phone)    settings.pages.phone    = mock.user.phone;
      if(mock.user.privacy)  settings.pages.privacy  = mock.user.privacy;

      // 录音质量当前选择
      if(mock.user.recordingQuality && mock.user.recordingQuality.current){
        var currentQuality = mock.user.recordingQuality.current;
        if(settings.pages.quality && settings.pages.quality.items){
          settings.pages.quality.items.forEach(function(item){
            if(item.label.indexOf(currentQuality) >= 0 ||
               (currentQuality === 'high-fidelity' && item.label.indexOf('高保真') >= 0)){
              item.value = '✓ 当前';
            }
          });
        }
      }
    }

    // 搜索热词
    if(mock.search){
      window.AppData.searchHotWords = mock.search.hotWords || [];
    }

    // 首页统计数据
    if(mock.stats){
      window.AppData.homeStats = mock.stats.home || [];
    }

    // 从 appConfig 派生别名
    if(window.AppData.appConfig){
      window.AppData.tabPages       = window.AppData.appConfig.tabPages;
      window.AppData.dialectFilters = window.AppData.appConfig.dialectFilters;
      window.AppData.dialectMap     = window.AppData.appConfig.dialectMap;
      window.AppData.genderBg       = window.AppData.appConfig.theme.genderBg;
    }

    console.log('[data-loader] 后端 Mock 数据解析完成');
  }

  /**
   * 显示全部加载失败的错误提示
   */
  function showLoadError(failedKeys){
    var existing = document.getElementById('dataLoadError');
    if(existing) existing.remove();

    var isFileProtocol = window.location.protocol === 'file:';
    var div = document.createElement('div');
    div.id = 'dataLoadError';
    div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(248,246,241,.95);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,-apple-system,sans-serif;padding:24px';
    div.innerHTML =
      '<div style="background:#fff;color:#1A1A1A;padding:32px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);max-width:360px;text-align:center">' +
        '<div style="font-size:48px;margin-bottom:16px">📡</div>' +
        '<div style="font-size:18px;font-weight:700;color:#B22222;margin-bottom:12px">数据加载失败</div>' +
        '<div style="font-size:13px;color:#666;line-height:1.8;margin-bottom:20px">' +
          (isFileProtocol ?
            '<strong>检测到您正在使用 file:// 协议直接打开 HTML 文件。</strong><br><br>' +
            '浏览器安全策略禁止 fetch() 调用后端 API。<br><br>' +
            '<strong>解决方法：</strong><br>' +
            '1. 在项目目录下启动后端服务：<br>' +
            '<code style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:12px">python backend.py</code><br><br>' +
            '2. 在浏览器中访问：<br>' +
            '<code style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:12px">http://localhost:8080/声脉APP.html</code>'
          :
            '<strong>后端服务未启动或不可达。</strong><br><br>' +
            '请确认已运行后端服务：<br>' +
            '<code style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:12px">python backend.py</code><br><br>' +
            '失败项：' + failedKeys.join(', ')
          ) +
        '</div>' +
        '<button onclick="location.reload()" style="background:#B22222;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer">重新加载</button>' +
      '</div>';
    document.body.appendChild(div);
  }

  /**
   * 显示部分加载失败的警告（不阻塞）
   */
  function showPartialError(failedKeys){
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#fff3cd;color:#856404;padding:8px 16px;border-radius:8px;font-size:12px;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,.1);max-width:90vw';
    div.textContent = '⚠ 部分数据加载失败: ' + failedKeys.join(', ') + '（请检查后端服务 /api 接口）';
    document.body.appendChild(div);
    setTimeout(function(){ div.remove(); }, 5000);
  }

  // DOM 就绪后开始加载
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadAll);
  }else{
    loadAll();
  }
})();
