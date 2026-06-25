import { useState } from 'react';
import { Sparkles, TrendingUp, Upload, ArrowRight, Image as ImageIcon, Video, Plane, Hotel, Ticket, FileText, Wand2 } from 'lucide-react';
import { TravelCard } from '../components/TravelCard';
import { ImportPanel } from '../components/ImportPanel';
import { travels } from '../data/mockData';

export default function Home() {
  const [importOpen, setImportOpen] = useState(false);
  const totalDays = travels.reduce((sum, t) => sum + t.days, 0);
  const totalPhotos = travels.reduce((sum, t) => sum + (t.aiData?.photos || 0), 0);
  const totalEvents = travels.reduce((sum, t) => sum + (t.aiData?.aiEvents || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-amber-50/20 to-rose-50/20">
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 p-8 md:p-12 text-white shadow-xl shadow-orange-200">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute top-6 right-6 opacity-20">
              <Wand2 size={120} />
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-amber-200" />
                <span className="text-sm font-medium text-amber-100">记录每一次出发</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">
                上传旅行资料<br />
                <span className="bg-gradient-to-r from-amber-100 to-white bg-clip-text text-transparent">
                  AI 帮你整理回忆
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/90 max-w-xl mb-6">
                扔进去一堆照片、订单、截图，AI 自动生成你的专属旅行档案。
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={() => setImportOpen(true)}
                  className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-orange-500 font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <Upload size={18} />
                  <span>导入旅行资料</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{travels.length}</p>
                  <p className="text-xs text-white/80">个旅程档案</p>
                </div>
                <div className="w-px h-10 bg-white/30" />
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{totalPhotos}</p>
                  <p className="text-xs text-white/80">张照片被识别</p>
                </div>
                <div className="w-px h-10 bg-white/30" />
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{totalEvents}</p>
                  <p className="text-xs text-white/80">个 AI 事件</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 p-5 rounded-3xl bg-white/60 backdrop-blur-sm border border-orange-100/60">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
              <Wand2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-1">
                AI 可以识别这些资料
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                扔给 Moment 越多的原始资料，AI 还原的旅行就越完整。
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: ImageIcon, label: '照片' },
                  { icon: Video, label: '视频' },
                  { icon: Plane, label: '机票截图' },
                  { icon: Hotel, label: '酒店订单' },
                  { icon: Ticket, label: '景点门票' },
                  { icon: FileText, label: '行程截图' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium"
                    >
                      <Icon size={12} />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">我的旅程档案</h2>
            <p className="text-sm text-gray-500 mt-1">
              点击查看 AI 自动还原的完整旅行
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <TrendingUp size={14} />
            <span>按时间排序</span>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {travels.map((travel) => (
            <TravelCard key={travel.id} travel={travel} />
          ))}
        </section>
      </main>

      <ImportPanel open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
