import { History, Globe } from 'lucide-react';

const HeroBanner = () => {
  return (
    <div className="relative min-h-[400px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-history-dark via-[#16213e] to-[#0f3460]" />
      
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-history-gold/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-history-blue/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-history-purple/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(91, 155, 213, 0.3)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute inset-0 opacity-15">
        <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#5B9BD5;stop-opacity:0.5" />
              <stop offset="100%" style="stop-color:#004A99;stop-opacity:0.5" />
            </linearGradient>
          </defs>
          <path
            d="M200,150 Q280,120 350,140 L450,180 Q500,220 480,280 L420,360 Q350,410 280,380 L180,320 Q140,260 160,200 Z
               M250,60 Q350,40 450,60 L520,110 Q550,160 520,210 L480,230 Q400,200 320,180 L260,160 Q220,130 220,80 Z
               M250,400 Q350,450 450,420 L520,470 Q550,520 500,560 L400,580 Q300,550 220,480 L180,410 Q220,380 250,400 Z
               M60,150 Q130,110 180,130 L220,190 Q200,260 160,300 L80,280 Q40,220 60,150 Z
               M480,150 Q580,120 650,170 L680,250 Q650,330 580,350 L520,310 Q500,250 480,210 Z
               M50,300 Q100,270 140,290 L160,350 Q140,390 90,370 L50,330 Z
               M600,80 Q680,50 750,100 L770,170 Q740,220 680,190 L620,130 Z"
            fill="url(#mapGradient)"
            stroke="#5B9BD5"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-history-gold/20 rounded-full animate-float">
            <History className="w-8 h-8 text-history-gold" />
          </div>
          <div className="p-3 bg-history-blue/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }}>
            <Globe className="w-8 h-8 text-history-blue" />
          </div>
        </div>
        
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-4 tracking-wide">
          <span className="text-history-gold">世界历史</span>时间线
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-2 font-light">
          公元前3100年 - 2000年
        </p>
        
        <p className="text-gray-400 max-w-2xl mx-auto">
          探索人类文明的重大历史事件，从古埃及第一王朝到全球化时代，见证人类历史的演进历程
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <div className="px-4 py-2 bg-history-gold/10 border border-history-gold/30 rounded-full text-history-gold text-sm font-medium">
            古代文明
          </div>
          <div className="px-4 py-2 bg-history-red/10 border border-history-red/30 rounded-full text-history-red text-sm font-medium">
            世界大战时期
          </div>
          <div className="px-4 py-2 bg-history-blue/10 border border-history-blue/30 rounded-full text-history-blue text-sm font-medium">
            全球化时代
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-history-dark to-transparent" />
    </div>
  );
};

export default HeroBanner;