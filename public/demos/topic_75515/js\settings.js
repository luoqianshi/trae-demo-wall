// ONE TOW MORE - 系统设置模块

class SettingsModule {
    constructor() {
        this.currentSection = 'profile';
        this.settings = {
            profile: { username: '管理员', email: 'admin@onetowmore.com', avatar: '' },
            model: { apiKey: 'sk-xxxxxxxxxxxxxxxxxxxx', provider: 'openai', model: 'gpt-4', temperature: 0.7, maxTokens: 4096, topP: 0.9 },
            vectorDb: { host: 'localhost', port: '6333', collection: 'default', chunkSize: 512, overlap: 64, embeddingModel: 'text-embedding-3-small' },
            evolution: { autoEvolve: true, feedbackThreshold: 10, kbLinkageThreshold: 5, scheduledEvolve: false, cronExpression: '0 2 * * *' },
            backup: { lastBackup: '2026-06-17 03:00', autoBackup: true, backupFrequency: 'daily' },
            security: { currentPassword: '', newPassword: '', confirmPassword: '', twoFactor: false }
        };
        this.init();
    }

    init() {
        this.renderSettings();
        this.initEventListeners();
    }

    renderSettings() {
        const contentEl = document.getElementById('settings-content');
        if (!contentEl) return;

        const menu = document.getElementById('settings-menu');
        if (menu) {
            menu.querySelectorAll('.settings-menu-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.section === this.currentSection) item.classList.add('active');
            });
        }

        const renderers = {
            profile: this.renderProfile.bind(this),
            model: this.renderModel.bind(this),
            vectorDb: this.renderVectorDb.bind(this),
            evolution: this.renderEvolution.bind(this),
            backup: this.renderBackup.bind(this),
            security: this.renderSecurity.bind(this)
        };

        contentEl.innerHTML = (renderers[this.currentSection] || renderers.profile)();
        this.initIcons();
    }

    initEventListeners() {
        const menu = document.getElementById('settings-menu');
        if (menu) {
            menu.querySelectorAll('.settings-menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.currentSection = item.dataset.section;
                    this.renderSettings();
                });
            });
        }
    }

    renderProfile() {
        const s = this.settings.profile;
        return `
            <div style="max-width: 600px;">
                <h3 style="margin-bottom: 24px;">个人信息</h3>
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 32px;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #8B5CF6); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; flex-shrink: 0;">
                        ${s.username.charAt(0)}
                    </div>
                    <div>
                        <button class="btn btn-sm" style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border);">
                            <i data-lucide="camera"></i> 更换头像
                        </button>
                        <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">支持 JPG、PNG 格式，不超过 2MB</p>
                    </div>
                </div>
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" id="setting-username" value="${s.username}">
                </div>
                <div class="form-group">
                    <label>邮箱地址</label>
                    <input type="email" id="setting-email" value="${s.email}">
                </div>
                <div class="form-group">
                    <label>所属角色</label>
                    <input type="text" value="系统管理员" disabled style="opacity: 0.6;">
                </div>
                <button class="btn btn-primary" onclick="settingsModule.saveProfile()"><i data-lucide="save"></i> 保存修改</button>
            </div>
        `;
    }

    renderModel() {
        const s = this.settings.model;
        return `
            <div style="max-width: 600px;">
                <h3 style="margin-bottom: 24px;">大模型配置</h3>
                <div class="form-group">
                    <label>API 密钥</label>
                    <div style="position: relative;">
                        <input type="password" id="setting-api-key" value="${s.apiKey}" style="padding-right: 80px;">
                        <button class="btn btn-sm" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border);" onclick="settingsModule.toggleApiKeyVisibility()">显示</button>
                    </div>
                    <small style="color: var(--text-muted); display: block; margin-top: 4px;">密钥将加密存储，不会明文展示</small>
                </div>
                <div class="form-group">
                    <label>模型服务商</label>
                    <select id="setting-provider">
                        <option value="openai" ${s.provider === 'openai' ? 'selected' : ''}>OpenAI</option>
                        <option value="anthropic" ${s.provider === 'anthropic' ? 'selected' : ''}>Anthropic (Claude)</option>
                        <option value="zhipu" ${s.provider === 'zhipu' ? 'selected' : ''}>智谱 AI (GLM)</option>
                        <option value="qwen" ${s.provider === 'qwen' ? 'selected' : ''}>通义千问 (Qwen)</option>
                        <option value="deepseek" ${s.provider === 'deepseek' ? 'selected' : ''}>DeepSeek</option>
                        <option value="custom" ${s.provider === 'custom' ? 'selected' : ''}>自定义 (OpenAI 兼容)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>基础模型</label>
                    <select id="setting-model">
                        <option value="gpt-4" ${s.model === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                        <option value="gpt-4-turbo" ${s.model === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo</option>
                        <option value="gpt-4o" ${s.model === 'gpt-4o' ? 'selected' : ''}>GPT-4o</option>
                        <option value="gpt-3.5-turbo" ${s.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Temperature (随机性) <span style="color: var(--accent);">${s.temperature}</span></label>
                    <input type="range" id="setting-temperature" min="0" max="2" step="0.1" value="${s.temperature}" oninput="this.previousElementSibling.querySelector('span').textContent=this.value">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
                        <span>精确 (0)</span><span>平衡 (1)</span><span>创意 (2)</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Max Tokens (最大输出长度)</label>
                    <input type="number" id="setting-max-tokens" value="${s.maxTokens}" min="256" max="128000" step="256">
                </div>
                <div class="form-group">
                    <label>Top P (核采样) <span style="color: var(--accent);">${s.topP}</span></label>
                    <input type="range" id="setting-top-p" min="0" max="1" step="0.05" value="${s.topP}" oninput="this.previousElementSibling.querySelector('span').textContent=this.value">
                </div>
                <button class="btn btn-primary" onclick="settingsModule.saveModel()"><i data-lucide="save"></i> 保存配置</button>
                <button class="btn" style="background: var(--bg-secondary); color: var(--text-primary); margin-left: 12px;" onclick="settingsModule.testModelConnection()"><i data-lucide="wifi"></i> 测试连接</button>
            </div>
        `;
    }

    renderVectorDb() {
        const s = this.settings.vectorDb;
        return `
            <div style="max-width: 600px;">
                <h3 style="margin-bottom: 24px;">向量数据库配置</h3>
                <div class="form-group">
                    <label>数据库类型</label>
                    <select>
                        <option>Qdrant</option>
                        <option>Milvus</option>
                        <option>Chroma</option>
                        <option>Weaviate</option>
                        <option>Pinecone</option>
                    </select>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-group">
                        <label>主机地址</label>
                        <input type="text" id="setting-vdb-host" value="${s.host}">
                    </div>
                    <div class="form-group">
                        <label>端口</label>
                        <input type="text" id="setting-vdb-port" value="${s.port}">
                    </div>
                </div>
                <div class="form-group">
                    <label>默认集合名称</label>
                    <input type="text" id="setting-vdb-collection" value="${s.collection}">
                </div>
                <div style="padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 20px;">
                    <h4 style="margin-bottom: 16px; font-size: 14px;">切片参数</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label>切片大小 (Token)</label>
                            <input type="number" id="setting-chunk-size" value="${s.chunkSize}" min="128" max="4096" step="64">
                        </div>
                        <div class="form-group">
                            <label>重叠长度 (Token)</label>
                            <input type="number" id="setting-overlap" value="${s.overlap}" min="0" max="512" step="32">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Embedding 模型</label>
                    <select id="setting-embedding">
                        <option value="text-embedding-3-small" ${s.embeddingModel === 'text-embedding-3-small' ? 'selected' : ''}>text-embedding-3-small (OpenAI)</option>
                        <option value="text-embedding-3-large" ${s.embeddingModel === 'text-embedding-3-large' ? 'selected' : ''}>text-embedding-3-large (OpenAI)</option>
                        <option value="bge-large-zh" ${s.embeddingModel === 'bge-large-zh' ? 'selected' : ''}>bge-large-zh (BAAI)</option>
                        <option value="m3e-base" ${s.embeddingModel === 'm3e-base' ? 'selected' : ''}>m3e-base (Moka)</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="settingsModule.saveVectorDb()"><i data-lucide="save"></i> 保存配置</button>
                <button class="btn" style="background: var(--bg-secondary); color: var(--text-primary); margin-left: 12px;" onclick="settingsModule.testVectorDbConnection()"><i data-lucide="wifi"></i> 测试连接</button>
            </div>
        `;
    }

    renderEvolution() {
        const s = this.settings.evolution;
        return `
            <div style="max-width: 600px;">
                <h3 style="margin-bottom: 24px;">进化规则配置</h3>
                <div style="padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500;">自动进化总开关</div>
                            <div style="font-size: 12px; color: var(--text-muted);">开启后 Skill 将根据规则自动迭代优化</div>
                        </div>
                        <label style="position: relative; display: inline-block; width: 48px; height: 24px; cursor: pointer;">
                            <input type="checkbox" id="setting-auto-evolve" ${s.autoEvolve ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${s.autoEvolve ? 'var(--accent)' : 'var(--text-muted)'}; border-radius: 12px; transition: var(--transition);"></span>
                            <span style="position: absolute; top: 2px; left: ${s.autoEvolve ? '26px' : '2px'}; width: 20px; height: 20px; background: white; border-radius: 50%; transition: var(--transition);"></span>
                        </label>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 16px; font-size: 14px;">触发机制配置</h4>

                    <div style="padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="message-circle" style="width: 20px; height: 20px; color: var(--accent);"></i>
                                <span style="font-size: 14px; font-weight: 500;">执行反馈进化</span>
                            </div>
                            <span style="font-size: 12px; color: var(--success);">已开启</span>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>触发阈值（反馈条数）</label>
                            <input type="number" value="${s.feedbackThreshold}" min="1" max="100">
                            <small style="color: var(--text-muted);">当累计用户反馈达到此数量时触发进化</small>
                        </div>
                    </div>

                    <div style="padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="database" style="width: 20px; height: 20px; color: #8B5CF6;"></i>
                                <span style="font-size: 14px; font-weight: 500;">知识库联动进化</span>
                            </div>
                            <span style="font-size: 12px; color: var(--success);">已开启</span>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>触发阈值（文档更新数）</label>
                            <input type="number" value="${s.kbLinkageThreshold}" min="1" max="100">
                            <small style="color: var(--text-muted);">当关联知识库更新文档数达到此数量时触发</small>
                        </div>
                    </div>

                    <div style="padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="clock" style="width: 20px; height: 20px; color: var(--warning);"></i>
                                <span style="font-size: 14px; font-weight: 500;">定时周期进化</span>
                            </div>
                            <span style="font-size: 12px; color: ${s.scheduledEvolve ? 'var(--success)' : 'var(--text-muted)'};">${s.scheduledEvolve ? '已开启' : '已关闭'}</span>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Cron 表达式</label>
                            <input type="text" value="${s.cronExpression}" placeholder="0 2 * * *">
                            <small style="color: var(--text-muted);">格式：分 时 日 月 周（例如：0 2 * * * 表示每天凌晨2点）</small>
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary" onclick="settingsModule.saveEvolution()"><i data-lucide="save"></i> 保存配置</button>
            </div>
        `;
    }

    renderBackup() {
        const s = this.settings.backup;
        return `
            <div style="max-width: 600px;">
                <h3 style="margin-bottom: 24px;">数据备份</h3>
                <div style="padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500;">上次备份时间</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${s.lastBackup}</div>
                        </div>
                        <span style="padding: 4px 10px; border-radius: 9999px; font-size: 11px; background: rgba(16,185,129,0.15); color: var(--success);">备份正常</span>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500;">自动备份</div>
                            <div style="font-size: 12px; color: var(--text-muted);">定期自动备份系统数据</div>
                        </div>
                        <span style="font-size: 12px; color: ${s.autoBackup ? 'var(--success)' : 'var(--text-muted)'};">${s.autoBackup ? '已开启' : '已关闭'}</span>
                    </div>
                    <div class="form-group">
                        <label>备份频率</label>
                        <select>
                            <option value="daily" ${s.backupFrequency === 'daily' ? 'selected' : ''}>每天</option>
                            <option value="weekly" ${s.backupFrequency === 'weekly' ? 'selected' : ''}>每周</option>
                            <option value="monthly" ${s.backupFrequency === 'monthly' ? 'selected' : ''}>每月</option>
                        </select>
                    </div>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" onclick="settingsModule.exportBackup()"><i data-lucide="download"></i> 手动备份</button>
                    <button class="btn" style="background: var(--bg-secondary); color: var(--text-primary);" onclick="settingsModule.importBackup()"><i data-lucide="upload"></i> 导入备份</button>
                </div>
            </div>
        `;
    }

    renderSecurity() {
        return `
            <div style="max-width: 600px;">
                <h3 style="margin-bottom: 24px;">账户安全</h3>
                <div class="form-group">
                    <label>当前密码</label>
                    <input type="password" id="setting-current-pwd" placeholder="输入当前密码">
                </div>
                <div class="form-group">
                    <label>新密码</label>
                    <input type="password" id="setting-new-pwd" placeholder="输入新密码（至少8位）">
                    <small style="color: var(--text-muted);">需包含大小写字母和数字</small>
                </div>
                <div class="form-group">
                    <label>确认新密码</label>
                    <input type="password" id="setting-confirm-pwd" placeholder="再次输入新密码">
                </div>
                <button class="btn btn-primary" onclick="settingsModule.changePassword()"><i data-lucide="lock"></i> 修改密码</button>

                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border);">
                    <h4 style="margin-bottom: 16px;">两步验证</h4>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <div>
                            <div style="font-size: 14px; font-weight: 500;">两步验证（2FA）</div>
                            <div style="font-size: 12px; color: var(--text-muted);">使用手机验证码增强账户安全</div>
                        </div>
                        <button class="btn btn-sm" style="background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border);">未启用</button>
                    </div>
                </div>

                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border);">
                    <h4 style="margin-bottom: 16px; color: var(--danger);">危险操作</h4>
                    <button class="btn" style="background: rgba(239,68,68,0.15); color: var(--danger); border: 1px solid rgba(239,68,68,0.3);" onclick="if(confirm('确定要重置所有数据吗？此操作不可恢复！')) alert('数据已重置');">
                        <i data-lucide="alert-triangle"></i> 重置所有数据
                    </button>
                </div>
            </div>
        `;
    }

    saveProfile() {
        this.settings.profile.username = document.getElementById('setting-username').value;
        this.settings.profile.email = document.getElementById('setting-email').value;
        alert('个人信息已保存！');
    }

    saveModel() {
        this.settings.model.apiKey = document.getElementById('setting-api-key').value;
        this.settings.model.provider = document.getElementById('setting-provider').value;
        this.settings.model.model = document.getElementById('setting-model').value;
        this.settings.model.temperature = parseFloat(document.getElementById('setting-temperature').value);
        this.settings.model.maxTokens = parseInt(document.getElementById('setting-max-tokens').value);
        this.settings.model.topP = parseFloat(document.getElementById('setting-top-p').value);
        alert('大模型配置已保存！');
    }

    toggleApiKeyVisibility() {
        const input = document.getElementById('setting-api-key');
        const btn = input.nextElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '隐藏';
        } else {
            input.type = 'password';
            btn.textContent = '显示';
        }
    }

    testModelConnection() {
        alert('正在测试模型连接...\n\n连接成功！模型响应正常，延迟 230ms。');
    }

    saveVectorDb() {
        this.settings.vectorDb.host = document.getElementById('setting-vdb-host').value;
        this.settings.vectorDb.port = document.getElementById('setting-vdb-port').value;
        this.settings.vectorDb.collection = document.getElementById('setting-vdb-collection').value;
        this.settings.vectorDb.chunkSize = parseInt(document.getElementById('setting-chunk-size').value);
        this.settings.vectorDb.overlap = parseInt(document.getElementById('setting-overlap').value);
        this.settings.vectorDb.embeddingModel = document.getElementById('setting-embedding').value;
        alert('向量数据库配置已保存！');
    }

    testVectorDbConnection() {
        alert('正在测试向量数据库连接...\n\n连接成功！当前集合包含 12,580 条向量数据。');
    }

    saveEvolution() {
        alert('进化规则配置已保存！');
    }

    exportBackup() {
        alert('数据备份已导出！\n\n备份文件：onetowmore_backup_20260618.zip\n大小：156 MB');
    }

    importBackup() {
        alert('请选择备份文件进行导入...\n\n支持 .zip 格式备份文件');
    }

    changePassword() {
        const current = document.getElementById('setting-current-pwd').value;
        const newPwd = document.getElementById('setting-new-pwd').value;
        const confirm = document.getElementById('setting-confirm-pwd').value;

        if (!current) { alert('请输入当前密码'); return; }
        if (newPwd.length < 8) { alert('新密码至少需要8位'); return; }
        if (newPwd !== confirm) { alert('两次输入的密码不一致'); return; }

        alert('密码修改成功！');
        document.getElementById('setting-current-pwd').value = '';
        document.getElementById('setting-new-pwd').value = '';
        document.getElementById('setting-confirm-pwd').value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsModule = new SettingsModule();
});
