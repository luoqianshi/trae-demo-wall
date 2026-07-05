// 学习首页 - 苹果风极简

import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ScanSearch,
  MessageSquare,
  PencilRuler,
  Bookmark,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles,
  Layers,
} from "lucide-react";
import HeroBackground from "@/components/HeroBackground";
import BlueprintThumbnail from "@/components/BlueprintThumbnail";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/storage";

const ENTRIES = [
  {
    to: "/recognition",
    title: "作业识别",
    desc: "上传图片/PDF/DOC，AI 智能识别机械图样",
    icon: ScanSearch,
    color: "from-apple-500 to-apple-600",
    bg: "bg-apple-50",
    iconBg: "bg-apple-100",
    iconColor: "text-apple-600",
  },
  {
    to: "/tutor",
    title: "交互答疑",
    desc: "对话式答疑，分步骤引导完成制图",
    icon: MessageSquare,
    color: "from-gray-800 to-gray-900",
    bg: "bg-gray-50",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-700",
  },
  {
    to: "/cad",
    title: "CAD 画板",
    desc: "内置 2D 绘图工具，跟随案例实战练习",
    icon: PencilRuler,
    color: "from-apple-500 to-apple-600",
    bg: "bg-apple-50",
    iconBg: "bg-apple-100",
    iconColor: "text-apple-600",
  },
  {
    to: "/templates",
    title: "记忆模板库",
    desc: "保存常用制图模板，记忆你的学习路径",
    icon: Bookmark,
    color: "from-gray-800 to-gray-900",
    bg: "bg-gray-50",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-700",
  },
];

export default function Home() {
  const user = useStore((s) => s.user);
  const recognitions = useStore((s) => s.recognitions);
  const templates = useStore((s) => s.templates);
  const loadRecognitions = useStore((s) => s.loadRecognitions);
  const loadTemplates = useStore((s) => s.loadTemplates);

  useEffect(() => {
    loadRecognitions();
    loadTemplates();
  }, [loadRecognitions, loadTemplates]);

  const recentRecognitions = recognitions.slice(0, 3);
  const recentTemplates = templates
    .slice()
    .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-full bg-white">
      {/* Hero 区 */}
      <section className="relative overflow-hidden">
        <HeroBackground />

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-apple-50 border border-apple-100 text-apple-600 text-sm font-medium animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>AI 智能学习</span>
          </div>

          <h1 className="text-big-title animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            你好，{user?.username || "工程师"}
          </h1>
          <h2 className="text-big-title text-apple-500 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            让制图变得简单
          </h2>

          <p
            className="mt-6 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.15s" }}
          >
            easy图图 是面向机械制图初学者的 AutoCAD 学习平台。
            AI 识别、即拍即搜、交互答疑、分步引导，帮你快速掌握核心技能。
          </p>

          <div
            className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Link to="/recognition" className="btn-primary">
              <ScanSearch className="w-4 h-4" />
              开始识别作业
            </Link>
            <Link to="/cad" className="btn-secondary">
              <PencilRuler className="w-4 h-4" />
              进入 CAD 画板
            </Link>
          </div>
        </div>
      </section>

      {/* 学习入口 */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mb-10">
          <h2 className="title-section text-3xl md:text-4xl">选择一个模块开始学习</h2>
          <p className="mt-2 text-gray-500">四大核心功能，循序渐进掌握机械制图</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
          {ENTRIES.map((entry, i) => (
            <Link
              key={entry.to}
              to={entry.to}
              className="group card card-hover p-6 md:p-7 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-2xl ${entry.iconBg} flex items-center justify-center`}
                >
                  <entry.icon className={`w-6 h-6 ${entry.iconColor}`} />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-apple-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1.5 tracking-tight">
                {entry.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{entry.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 最近识别 + 模板推荐 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10">
            {/* 最近识别 */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-apple-500" />
                  最近识别
                </h3>
                <Link to="/recognition" className="text-sm text-apple-500 hover:underline">
                  查看全部
                </Link>
              </div>

              {recentRecognitions.length === 0 ? (
                <div className="card p-8 text-center">
                  <ScanSearch className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">还没有识别记录</p>
                  <Link to="/recognition" className="btn-ghost text-sm mt-2">
                    立即识别 →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRecognitions.map((rec) => (
                    <Link
                      key={rec.id}
                      to="/recognition"
                      className="card card-hover flex items-center gap-3 p-3"
                    >
                      <div className="w-12 h-12 flex-shrink-0">
                        {rec.thumbnail.startsWith("data:") ? (
                          <img
                            src={rec.thumbnail}
                            alt={rec.fileName}
                            className="w-full h-full object-cover rounded-xl border border-gray-100"
                          />
                        ) : (
                          <BlueprintThumbnail type={rec.thumbnail} className="w-full h-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {rec.fileName}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatDate(rec.createdAt)}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 模板推荐 */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-apple-500" />
                  常用模板
                </h3>
                <Link to="/templates" className="text-sm text-apple-500 hover:underline">
                  查看全部
                </Link>
              </div>

              {recentTemplates.length === 0 ? (
                <div className="card p-8 text-center">
                  <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">暂无模板</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTemplates.map((tpl) => (
                    <Link
                      key={tpl.id}
                      to="/templates"
                      className="card card-hover flex items-center gap-3 p-3"
                    >
                      <BlueprintThumbnail type={tpl.thumbnail} className="w-12 h-12 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {tpl.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="tag">{tpl.category}</span>
                          {tpl.favorite && <span className="text-apple-500 text-xs">★</span>}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 特色 */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="title-section text-3xl md:text-4xl">为什么选择 easy图图</h2>
          <p className="mt-2 text-gray-500">专为机械制图初学者打造</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: ScanSearch, title: "AI 智能识别", desc: "图片/PDF/DOC 即拍即搜" },
            { icon: Layers, title: "记忆式学习", desc: "记忆搜索模板与学习路径" },
            { icon: MessageSquare, title: "交互答疑", desc: "对话式解决制图疑惑" },
            { icon: PencilRuler, title: "CAD 实战", desc: "内置画板跟随练习" },
          ].map((f, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-apple-50 mb-4">
                <f.icon className="w-6 h-6 text-apple-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
