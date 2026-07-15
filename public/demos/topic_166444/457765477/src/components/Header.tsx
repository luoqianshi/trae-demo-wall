import { Calculator } from 'lucide-react';

export const Header = () => {
  return (
    <header className="py-6 text-center">
      <div className="flex items-center justify-center gap-3">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
          <Calculator className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          数学小天才
        </h1>
      </div>
      <p className="mt-2 text-primary-700 font-medium">趣味数学练习，快乐成长！</p>
    </header>
  );
};