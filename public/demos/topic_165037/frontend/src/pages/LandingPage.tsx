import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  Brain,
  Target,
  BookMarked,
  TrendingUp,
  Globe,
  Zap,
  ChevronRight,
  Star,
  ArrowRight,
  CheckCircle,
  GraduationCap,
  Clock,
  FileText
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI智能改写',
      description: '基于大语言模型，将原始新闻改写为5个难度等级的阅读材料，精准匹配你的备考水平。',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: '分级难度体系',
      description: '覆盖中考、高考、四级、六级、考研五大考试阶段，每篇文章严格按照考试标准字数编写。',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: '智能出题系统',
      description: 'AI自动生成阅读理解题目，包含细节理解、推理判断、词义猜测、主旨大意等多种题型。',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <BookMarked className="w-8 h-8" />,
      title: '生词本记忆',
      description: '自动记录阅读中的生词，智能复习算法帮助高效记忆，连续5次掌握自动移除。',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: '学习轨迹追踪',
      description: '完整记录你的阅读历史和答题情况，清晰展示学习进度和能力提升。',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: '每日热点更新',
      description: '自动从NASA、Ars Technica等权威来源采集全球最新科技、科学资讯。',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const stats = [
    { number: '5', label: '难度等级', unit: '级' },
    { number: '11+', label: '精选文章', unit: '篇' },
    { number: '5', label: '题型覆盖', unit: '类' },
    { number: '4-5', label: '每篇题目', unit: '道' }
  ];

  const examLevels = [
    { name: '中考', words: '200-300词', desc: '初中毕业水平' },
    { name: '高考', words: '300-400词', desc: '高中毕业水平' },
    { name: '四级', words: '300-500词', desc: '大学四级水平' },
    { name: '六级', words: '400-600词', desc: '大学六级水平' },
    { name: '考研', words: '400-800词', desc: '研究生入学水平' }
  ];

  const demoAccount = {
    email: 'demo@yuezhi.ai',
    password: 'demo123456'
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">阅知AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              免费体验
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                <span>AI驱动的英语阅读学习平台</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
                用AI重新定义
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  英语阅读
                </span>
                <br />
                学习体验
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                每日精选全球热点新闻，AI智能改写为五大考试难度，配合阅读理解题目，
                让你在阅读中提升英语能力，轻松备考。
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  立即开始体验
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  登录账号
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-medium mb-2">🎁 演示账号（直接登录体验）</p>
                <div className="flex gap-4 text-sm text-amber-700">
                  <span>邮箱：<code className="bg-amber-100 px-2 py-0.5 rounded">{demoAccount.email}</code></span>
                  <span>密码：<code className="bg-amber-100 px-2 py-0.5 rounded">{demoAccount.password}</code></span>
                </div>
              </div>
            </div>

            <div className={`relative transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-semibold">今日推荐阅读</span>
                    </div>
                    <p className="text-blue-100 text-sm">AI为你精选 · 适配四级难度</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">四级</span>
                      <span className="text-xs text-gray-400">科学 · NASA</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Hubble Sees Crimson Cloud and Stars
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      NASA's Hubble Space Telescope has captured a stunning image of a crimson cloud...
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 3分钟
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> 355词
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                      <GraduationCap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">5级难度</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                      <BookMarked className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">生词本</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                      <Target className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">阅读测验</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                  <span className="text-2xl">{stat.unit}</span>
                </div>
                <p className="text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">核心功能</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              基于AI大模型技术，为你打造个性化的英语阅读学习体验
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-100 group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Levels Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">五级难度体系</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              精准匹配五大英语考试，无论你处于哪个阶段，都能找到适合的阅读材料
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {examLevels.map((level, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-500 transition-colors text-center group"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{level.name}</h3>
                <p className="text-sm text-blue-600 font-medium mb-1">{level.words}</p>
                <p className="text-xs text-gray-500">{level.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">如何使用</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              三步开启你的AI英语阅读之旅
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: '选择备考阶段',
                description: '注册时选择你的备考目标，系统自动匹配对应难度的阅读材料。'
              },
              {
                step: '02',
                title: '每日阅读练习',
                description: '阅读AI精选的热点文章，配合阅读理解题目，检验学习效果。'
              },
              {
                step: '03',
                title: '积累巩固提升',
                description: '生词自动加入生词本，智能复习帮助巩固，持续提升阅读能力。'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                  <div className="text-6xl font-bold text-blue-100 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-8 h-8 text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">准备好开始了吗？</h2>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                立即免费体验阅知AI，让AI帮你高效提升英语阅读能力
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  免费注册体验
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-8 py-4 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/30"
                >
                  使用演示账号登录
                </button>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm text-blue-100">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> 无需信用卡
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> 免费体验
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> 随时取消
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">阅知AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span>AI驱动的英语阅读学习平台</span>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 阅知AI Demo版本 · 仅供演示使用</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
