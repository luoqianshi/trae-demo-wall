import { useState } from 'react';
import { Save, User, Bell, Shield, Palette } from 'lucide-react';

export const Settings = () => {
  const [settings, setSettings] = useState({
    voiceRecognition: {
      enabled: true,
      sensitivity: 70,
      autoStart: false,
    },
    faceRecognition: {
      enabled: true,
      confidenceThreshold: 80,
    },
    notifications: {
      newOrder: true,
      paymentSuccess: true,
      lowStock: false,
    },
    appearance: {
      theme: 'dark',
      accentColor: '#3b82f6',
    },
  });

  const handleSave = () => {
    alert('设置已保存');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
          <p className="text-gray-500 mt-1">配置应用的各项参数</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
        >
          <Save className="w-5 h-5" />
          <span className="font-medium">保存设置</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">语音识别</h2>
              <p className="text-sm text-gray-500">配置语音点餐功能</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">启用语音识别</p>
                <p className="text-sm text-gray-500">允许应用监听对话并提取订单</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, voiceRecognition: { ...settings.voiceRecognition, enabled: !settings.voiceRecognition.enabled } })}
                className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  settings.voiceRecognition.enabled ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform duration-200 ${
                  settings.voiceRecognition.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-800">识别灵敏度</p>
                <span className="text-sm text-gray-500">{settings.voiceRecognition.sensitivity}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={settings.voiceRecognition.sensitivity}
                onChange={(e) => setSettings({ ...settings, voiceRecognition: { ...settings.voiceRecognition, sensitivity: parseInt(e.target.value) } })}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">自动开始监听</p>
                <p className="text-sm text-gray-500">进入AR界面时自动开始监听</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, voiceRecognition: { ...settings.voiceRecognition, autoStart: !settings.voiceRecognition.autoStart } })}
                className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  settings.voiceRecognition.autoStart ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform duration-200 ${
                  settings.voiceRecognition.autoStart ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">人脸识别</h2>
              <p className="text-sm text-gray-500">配置顾客识别功能</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">启用人脸识别</p>
                <p className="text-sm text-gray-500">允许应用识别顾客身份</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, faceRecognition: { ...settings.faceRecognition, enabled: !settings.faceRecognition.enabled } })}
                className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  settings.faceRecognition.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transform transition-transform duration-200 ${
                  settings.faceRecognition.enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-800">置信度阈值</p>
                <span className="text-sm text-gray-500">{settings.faceRecognition.confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={settings.faceRecognition.confidenceThreshold}
                onChange={(e) => setSettings({ ...settings, faceRecognition: { ...settings.faceRecognition, confidenceThreshold: parseInt(e.target.value) } })}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">通知设置</h2>
              <p className="text-sm text-gray-500">配置应用通知</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'newOrder', label: '新订单通知', desc: '收到新订单时发送通知' },
              { key: 'paymentSuccess', label: '支付成功通知', desc: '顾客支付成功时发送通知' },
              { key: 'lowStock', label: '库存不足通知', desc: '商品库存低于阈值时发送通知' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, [item.key]: !settings.notifications[item.key as keyof typeof settings.notifications] } })}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    settings.notifications[item.key as keyof typeof settings.notifications] ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transform transition-transform duration-200 ${
                    settings.notifications[item.key as keyof typeof settings.notifications] ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">外观设置</h2>
              <p className="text-sm text-gray-500">配置界面主题</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-800 mb-3">主题模式</p>
              <div className="flex gap-2">
                {['dark', 'light'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, theme } })}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                      settings.appearance.theme === theme
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {theme === 'dark' ? '深色模式' : '浅色模式'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium text-gray-800 mb-3">主题色</p>
              <div className="flex gap-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSettings({ ...settings, appearance: { ...settings.appearance, accentColor: color } })}
                    className={`w-10 h-10 rounded-full border-2 transition-transform ${
                      settings.appearance.accentColor === color ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
