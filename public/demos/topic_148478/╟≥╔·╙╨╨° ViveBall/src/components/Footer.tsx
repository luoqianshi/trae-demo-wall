import { Leaf, Heart, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold">ViveBall</span>
                <span className="text-xs text-primary-400">球生有续</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              ViveBall 致力于推动网球回收事业，通过创新的公益平台，
              让每一个旧网球都能焕发新生，共同守护我们的地球家园。
            </p>
            <p className="text-gray-500 text-xs">
              用爱心守护地球，让网球重获新生 💚
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                  首页
                </a>
              </li>
              <li>
                <a href="/checkin" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                  拍照打卡
                </a>
              </li>
              <li>
                <a href="/shop" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                  积分商城
                </a>
              </li>
              <li>
                <a href="/leaderboard" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                  排行榜
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">联系我们</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>contact@viveball.org</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="w-4 h-4" />
                <span>400-888-9999</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>北京市朝阳区环保大厦</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            © 2026 ViveBall. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500" /> for the environment
          </p>
        </div>
      </div>
    </footer>
  );
}
