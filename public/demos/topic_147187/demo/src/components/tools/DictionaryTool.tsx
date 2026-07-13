import { useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { mockDictionary, DictionaryEntry } from '../../utils/mockData';

export const DictionaryTool = ({ onClose }: { onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = () => {
    const trimmedQuery = query.trim().toLowerCase();
    const entry = mockDictionary[trimmedQuery];
    if (entry) {
      setResult(entry);
      setNotFound(false);
    } else {
      setResult(null);
      setNotFound(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white">双语词典</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入单词或汉字..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
        </div>
        <button
          onClick={handleSearch}
          className="w-full mt-3 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all"
        >
          查询
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {result && (
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline gap-3">
                <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{result.word}</h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">{result.phonetic}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  {result.partOfSpeech}
                </span>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">释义</p>
              <p className="text-gray-700 dark:text-gray-200">{result.meaning}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">例句</p>
              <p className="text-gray-700 dark:text-gray-200 italic">{result.example}</p>
            </div>
          </div>
        )}

        {notFound && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">未找到该词汇，请尝试其他查询</p>
          </div>
        )}

        {!result && !notFound && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">请输入单词或汉字进行查询</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="text-xs text-gray-400">示例：</span>
              {Object.keys(mockDictionary).slice(0, 4).map((word) => (
                <button
                  key={word}
                  onClick={() => {
                    setQuery(word);
                    handleSearch();
                  }}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};