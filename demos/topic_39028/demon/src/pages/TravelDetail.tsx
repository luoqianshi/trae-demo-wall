import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, RefreshCw, Image as ImageIcon, Video, FileText, Sparkles, BookOpen, Camera } from 'lucide-react';
import { AIAnalysisStatus } from '../components/AIAnalysisStatus';
import { Timeline } from '../components/Timeline';
import { MapTrack } from '../components/MapTrack';
import { HotelInfo } from '../components/HotelInfo';
import { FlightInfo } from '../components/FlightInfo';
import { PhotoWall } from '../components/PhotoWall';
import { AIDiary } from '../components/AIDiary';
import { ExpenseStats } from '../components/ExpenseStats';
import { MemoryCard } from '../components/MemoryCard';
import { AIInsights } from '../components/AIInsights';
import { TravelProgress } from '../components/TravelProgress';
import { ContinueRecordPanel } from '../components/ContinueRecordPanel';
import { IncrementalAnalysis } from '../components/IncrementalAnalysis';
import { travelDetails } from '../data/mockData';

export default function TravelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const travel = id ? travelDetails[id] : null;

  const [recordOpen, setRecordOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const handleAnalysisComplete = useCallback(() => {
    setAnalysisOpen(false);
  }, []);

  if (!travel) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <p className="text-gray-500">旅程不存在</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const ai = travel.aiData;
  const isProcessing = travel.aiAnalysisStatus === 'processing';

  const handleReanalyze = () => {
    navigate(`/processing/${travel.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-amber-50/20 to-rose-50/20">
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={travel.coverImage}
          alt={travel.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute top-20 right-6 flex items-center gap-2">
          <button
            onClick={() => navigate(`/travel/${travel.id}/memory-book`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 text-white text-sm font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <BookOpen size={14} />
            <span>生成旅行回忆册</span>
          </button>
          <button
            onClick={handleReanalyze}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-sm text-orange-500 text-sm font-medium shadow-lg hover:bg-white transition-all"
          >
            <RefreshCw size={14} />
            <span>AI 重新整理</span>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-3">{travel.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{travel.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>
                  {formatDate(travel.startDate)} - {formatDate(travel.endDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <AIAnalysisStatus progress={travel.aiProgress} status={travel.aiAnalysisStatus} />

        {'completion' in travel && (
          <section>
            <TravelProgress completion={(travel as any).completion} />
          </section>
        )}

        {ai && (
          <section>
            <SectionTitle
              title="AI 旅行统计"
              subtitle="AI 从你的资料中自动汇总的关键数据"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { icon: ImageIcon, label: '照片', value: ai.photos, color: 'text-pink-500' },
                { icon: Video, label: '视频', value: ai.videos, color: 'text-purple-500' },
                { icon: FileText, label: '订单', value: ai.orders, color: 'text-blue-500' },
                { icon: Sparkles, label: 'AI 事件', value: ai.aiEvents, color: 'text-orange-500' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                  >
                    <Icon size={18} className={item.color} />
                    <p className="text-2xl font-bold text-gray-800 mt-2">{item.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                  </div>
                );
              })}
            </div>
            <AIInsights data={ai} travelId={travel.id} />
          </section>
        )}

        <section>
          <SectionTitle
            title="AI 自动还原的旅行轨迹"
            subtitle="把零散的照片、订单、视频串成一条时间线"
          />
          <Timeline items={travel.timeline} />
        </section>

        <section>
          <SectionTitle title="地图轨迹" subtitle="AI 智能整理的旅行路线" />
          <MapTrack track={travel.mapTrack} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <SectionTitle title="机票信息" subtitle="AI 识别的航班记录" />
            <FlightInfo flights={travel.flights} />
          </div>
          <div>
            <SectionTitle title="酒店住宿" subtitle="AI 整理的入住信息" />
            <HotelInfo hotels={travel.hotels} />
          </div>
        </section>

        <section>
          <SectionTitle
            title="照片墙"
            subtitle={`AI 已识别 ${travel.photos.length} 张精彩照片，点击放大`}
          />
          <PhotoWall photos={travel.photos} />
        </section>

        <section>
          <SectionTitle
            title="AI 旅行手账"
            subtitle={isProcessing ? 'AI 正在补全剩余内容...' : 'AI 根据时间线自动生成的旅行故事与每日记录'}
          />
          <AIDiary
            content={travel.aiDiary}
            journalEntries={'journalEntries' in travel ? (travel as any).journalEntries : []}
          />
        </section>

        <section>
          <SectionTitle title="花费统计" subtitle="AI 自动分类的旅行账单" />
          <ExpenseStats expenses={travel.expenses} />
        </section>

        <section>
          <SectionTitle title="旅行回忆卡" subtitle="点击翻面查看 AI 写下的背后故事" />
          <MemoryCard cards={travel.memoryCards} />
        </section>

        <section className="text-center pt-8 pb-4">
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 rounded-3xl p-8 md:p-12 border border-orange-100/60">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
              <BookOpen size={24} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">把这次旅行变成一本回忆册</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              AI 会将你的照片、轨迹和故事编织成一份值得永久珍藏的旅行杂志
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate(`/travel/${travel.id}/memory-book`)}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <BookOpen size={18} />
                <span>生成旅行回忆册</span>
              </button>
              <button
                onClick={handleReanalyze}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-gray-600 border border-gray-200 font-medium hover:border-orange-300 hover:text-orange-500 transition-all"
              >
                <RefreshCw size={16} />
                <span>让 AI 重新整理这本档案</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <ContinueRecordPanel
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onStartAnalysis={() => setAnalysisOpen(true)}
        travelTitle={travel.title}
      />

      <IncrementalAnalysis
        open={analysisOpen}
        onComplete={handleAnalysisComplete}
      />

      <button
        onClick={() => setRecordOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold shadow-xl shadow-orange-300/40 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all"
      >
        <Camera size={20} />
        <span>继续记录</span>
      </button>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
