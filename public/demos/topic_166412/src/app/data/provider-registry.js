(function () {
  const CRED_STANDARD = { value: 'standard', label: '普通 API', desc: '标准 API Key 认证' };
  const CRED_TOKEN_PLAN = { value: 'token_plan', label: 'Token Plan（订阅/本地）', desc: '订阅令牌或本地测试 Token' };
  const CRED_CODING_PLAN = function (name) {
    return { value: 'coding_plan', label: name + ' Coding Plan', desc: '需在对应平台开通 Coding Plan 套餐' };
  };

  const providers = {
    xiaomi_mimo: {
      id: 'xiaomi_mimo',
      label: '小米 MiMo',
      short: 'MiMo',
      bg: 'linear-gradient(135deg,#FF6900,#E85D00)',
      defaultBaseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
      supportedCredentialTypes: [
        CRED_STANDARD,
        { value: 'token_plan', label: 'Token Plan（订阅）', desc: 'Token Plan 订阅令牌（tp-开头）' }
      ],
      defaultCredentialType: 'token_plan',
      defaultLabel: 'MiMo Token Plan',
      defaultLabelByCredential: {
        standard: 'MiMo API',
        token_plan: 'MiMo Token Plan'
      },
      defaultBaseUrlByCredential: {
        standard: 'https://api.xiaomimimo.com/v1',
        token_plan: 'https://token-plan-cn.xiaomimimo.com/v1'
      },
      models: ['mimo-v2.5-pro', 'mimo-v2.5'],
      hintByCredential: {
        standard: '按量付费 API 使用 sk- 开头的 API Key，Base URL 为 https://api.xiaomimimo.com/v1',
        token_plan: 'Token Plan 使用 tp- 开头的访问令牌，Base URL 为 https://token-plan-cn.xiaomimimo.com/v1'
      },
      regions: ['cn']
    },

    deepseek: {
      id: 'deepseek',
      label: 'DeepSeek',
      short: 'DS',
      bg: 'linear-gradient(135deg,#4D6BFE,#2E4DD8)',
      defaultBaseUrl: 'https://api.deepseek.com',
      supportedCredentialTypes: [CRED_STANDARD],
      defaultCredentialType: 'standard',
      defaultLabel: 'DeepSeek',
      models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v4-flash', 'deepseek-v4-pro'],
      regions: ['cn']
    },

    volcengine_ark: {
      id: 'volcengine_ark',
      label: '火山方舟（豆包）',
      short: '豆包',
      bg: 'linear-gradient(135deg,#3D5AFE,#1A3FE0)',
      defaultBaseUrl: 'https://ark.cn-beijing.volces.com',
      supportedCredentialTypes: [
        CRED_STANDARD,
        CRED_CODING_PLAN('豆包')
      ],
      defaultCredentialType: 'standard',
      defaultLabel: '火山方舟',
      defaultLabelByCredential: {
        standard: '火山方舟',
        coding_plan: '豆包 Coding Plan'
      },
      models: ['doubao-pro-32k', 'doubao-pro-128k', 'doubao-lite-32k', 'doubao-1.5-pro', 'doubao-1.5-lite'],
      hintByCredential: {
        coding_plan: '豆包 Coding Plan 需在火山引擎方舟控制台开通对应套餐，Token 为 Coding Plan 专用令牌。'
      },
      regions: ['cn']
    },

    opencode_go: {
      id: 'opencode_go',
      label: 'OpenCode Go',
      short: 'OCG',
      bg: 'linear-gradient(135deg,#7B6FB0,#5B4A8C)',
      defaultBaseUrl: '',
      supportedCredentialTypes: [CRED_STANDARD],
      defaultCredentialType: 'standard',
      defaultLabel: 'OpenCode Go',
      models: ['opencode-go-v1', 'opencode-go-mini'],
      regions: ['cn']
    },

    zhipu: {
      id: 'zhipu',
      label: '智谱 AI（GLM）',
      short: 'GLM',
      bg: 'linear-gradient(135deg,#3B6EFF,#2A55CC)',
      defaultBaseUrl: 'https://open.bigmodel.cn',
      supportedCredentialTypes: [
        CRED_STANDARD,
        CRED_CODING_PLAN('GLM')
      ],
      defaultCredentialType: 'standard',
      defaultLabel: '智谱 GLM',
      defaultLabelByCredential: {
        standard: '智谱 GLM',
        coding_plan: 'GLM Coding Plan'
      },
      models: ['glm-4-plus', 'glm-4-air', 'glm-4-flash', 'glm-4-long', 'glm-zero-preview', 'chatglm_turbo'],
      hintByCredential: {
        coding_plan: 'GLM Coding Plan 需在智谱开放平台开通 Coding Plan 套餐。'
      },
      regions: ['cn']
    },

    moonshot: {
      id: 'moonshot',
      label: 'Moonshot（Kimi）',
      short: 'Kimi',
      bg: 'linear-gradient(135deg,#7C3AED,#5B28A8)',
      defaultBaseUrl: 'https://api.moonshot.cn',
      supportedCredentialTypes: [
        CRED_STANDARD,
        CRED_CODING_PLAN('Kimi')
      ],
      defaultCredentialType: 'standard',
      defaultLabel: 'Moonshot Kimi',
      defaultLabelByCredential: {
        standard: 'Moonshot Kimi',
        coding_plan: 'Kimi Coding Plan'
      },
      models: ['kimi-k2.5', 'kimi-k2-thinking', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
      hintByCredential: {
        coding_plan: 'Kimi Coding Plan 需在 Moonshot 平台开通 Coding Plan 套餐。'
      },
      regions: ['cn']
    },

    openai: {
      id: 'openai',
      label: 'OpenAI',
      short: 'GPT',
      bg: 'linear-gradient(135deg,#10a37f,#0d8a6a)',
      defaultBaseUrl: 'https://api.openai.com',
      supportedCredentialTypes: [CRED_STANDARD],
      defaultCredentialType: 'standard',
      defaultLabel: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o3-mini', 'o1', 'gpt-3.5-turbo'],
      regions: ['sgp', 'eu', 'cn']
    },

    anthropic: {
      id: 'anthropic',
      label: 'Anthropic（Claude）',
      short: 'Claude',
      bg: 'linear-gradient(135deg,#D97757,#B85A3D)',
      defaultBaseUrl: 'https://api.anthropic.com',
      supportedCredentialTypes: [CRED_STANDARD],
      defaultCredentialType: 'standard',
      defaultLabel: 'Anthropic Claude',
      models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-haiku'],
      regions: ['sgp', 'eu']
    },

    codex: {
      id: 'codex',
      label: 'ChatGPT / Codex（订阅）',
      short: 'Codex',
      bg: 'linear-gradient(135deg,#10a37f,#0d8a6a)',
      defaultBaseUrl: 'https://chatgpt.com',
      supportedCredentialTypes: [
        { value: 'token_plan', label: 'Token Plan（订阅）', desc: 'ChatGPT Plus/Pro 订阅令牌' }
      ],
      defaultCredentialType: 'token_plan',
      defaultLabel: 'ChatGPT Codex',
      models: ['gpt-5-codex', 'gpt-5.1-codex', 'gpt-5.1-codex-max', 'gpt-5.1-codex-mini', 'gpt-5.2-codex'],
      hintByCredential: {
        token_plan: 'Codex 使用 ChatGPT 订阅 Access Token / Refresh Token，非标准 API Key。'
      },
      regions: ['sgp', 'eu']
    },

    minimax: {
      id: 'minimax',
      label: 'MiniMax',
      short: 'MM',
      bg: 'linear-gradient(135deg,#7C3AED,#5B28A8)',
      defaultBaseUrl: 'https://api.minimax.chat',
      supportedCredentialTypes: [CRED_STANDARD],
      defaultCredentialType: 'standard',
      defaultLabel: 'MiniMax',
      models: ['abab6.5-chat', 'abab6.5s-chat', 'MiniMax-M2.7', 'MiniMax-M2.1'],
      regions: ['cn']
    },

    qwen: {
      id: 'qwen',
      label: '通义千问（阿里）',
      short: '通义',
      bg: 'linear-gradient(135deg,#615CED,#4A47C8)',
      defaultBaseUrl: 'https://dashscope.aliyuncs.com',
      supportedCredentialTypes: [CRED_STANDARD],
      defaultCredentialType: 'standard',
      defaultLabel: '通义千问',
      models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwq-32b', 'qwen3-235b-a22b'],
      regions: ['cn']
    },

    xai: {
      id: 'xai',
      label: 'xAI（Grok）',
      short: 'Grok',
      bg: 'linear-gradient(135deg,#1da1f2,#0c85d0)',
      defaultBaseUrl: 'https://api.x.ai',
      supportedCredentialTypes: [CRED_STANDARD],
      defaultCredentialType: 'standard',
      defaultLabel: 'xAI Grok',
      models: ['grok-4-0709', 'grok-3-mini', 'grok-3'],
      regions: ['sgp', 'eu']
    },

    siliconflow: {
      id: 'siliconflow',
      label: '硅基流动（SiliconFlow）',
      short: '硅基',
      bg: 'linear-gradient(135deg,#FF4D4F,#CF1322)',
      defaultBaseUrl: 'https://api.siliconflow.cn',
      supportedCredentialTypes: [CRED_STANDARD],
      defaultCredentialType: 'standard',
      defaultLabel: '硅基流动',
      models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct'],
      regions: ['cn']
    }
  };

  const credentialTypeMeta = {
    standard: {
      placeholder: 'API Key（sk-...），只写入加密存储，不会回显',
      label: '普通 API'
    },
    token_plan: {
      placeholder: '访问令牌（tp-开头），Token Plan 订阅专用',
      label: 'Token Plan'
    },
    coding_plan: {
      placeholder: 'Coding Plan Token（需先在对应平台开通 Coding Plan 套餐）',
      label: 'Coding Plan'
    }
  };

  const legacyProviderAlias = {
    coding_plan: { provider: 'volcengine_ark', credentialType: 'coding_plan' }
  };

  window.MiniFishProviderRegistry = {
    providers,
    credentialTypeMeta,
    legacyProviderAlias,
    getProvider(id) {
      return providers[id] || null;
    },
    getProviderList() {
      return Object.values(providers);
    },
    resolveCredentialTypes(providerId) {
      const p = providers[providerId];
      return p ? p.supportedCredentialTypes : [CRED_STANDARD];
    },
    resolveDefaultLabel(providerId, credentialType) {
      const p = providers[providerId];
      if (!p) return providerId;
      if (p.defaultLabelByCredential && p.defaultLabelByCredential[credentialType]) {
        return p.defaultLabelByCredential[credentialType];
      }
      return p.defaultLabel;
    },
    resolveHint(providerId, credentialType) {
      const p = providers[providerId];
      if (!p || !p.hintByCredential) return '';
      return p.hintByCredential[credentialType] || '';
    },
    resolveDefaultBaseUrl(providerId, credentialType) {
      const p = providers[providerId];
      if (!p) return '';
      if (p.defaultBaseUrlByCredential && p.defaultBaseUrlByCredential[credentialType]) {
        return p.defaultBaseUrlByCredential[credentialType];
      }
      return p.defaultBaseUrl || '';
    },
    resolveLegacy(providerId) {
      return legacyProviderAlias[providerId] || null;
    }
  };
})();
