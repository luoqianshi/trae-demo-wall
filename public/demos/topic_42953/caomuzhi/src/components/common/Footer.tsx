import { Leaf, Mail, MapPin, Phone, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-plant-dark text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-8 h-8 text-accent-amber" />
              <span className="text-xl font-bold">草木志</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              用AI探索草木世界，传承千年古籍智慧。让每一次识别都成为一次知识的探索之旅。
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">探索</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><button className="hover:text-accent-amber transition-colors">植物图鉴</button></li>
              <li><button className="hover:text-accent-amber transition-colors">AI识别</button></li>
              <li><button className="hover:text-accent-amber transition-colors">古籍文库</button></li>
              <li><button className="hover:text-accent-amber transition-colors">热门草木</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">关于我们</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><button className="hover:text-accent-amber transition-colors">团队介绍</button></li>
              <li><button className="hover:text-accent-amber transition-colors">联系方式</button></li>
              <li><button className="hover:text-accent-amber transition-colors">隐私政策</button></li>
              <li><button className="hover:text-accent-amber transition-colors">用户协议</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">联系我们</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent-amber" />
                <span>400-888-9999</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent-amber" />
                <span>contact@caomuzhi.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent-amber" />
                <span>北京市朝阳区科技园区</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 草木志. 保留所有权利.
            </p>
            <p className="flex items-center gap-1 text-gray-400 text-sm">
              用 <Heart className="w-4 h-4 text-emphasis-coral fill-emphasis-coral" /> 打造沉浸式草木探索体验
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
