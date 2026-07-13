import { Clock, BookOpen, Award, ChevronRight } from 'lucide-react';
import { useRecordStore } from '../../stores/recordStore';

export const RecordList = () => {
  const { records } = useRecordStore();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      数学: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
      语文: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
      英语: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
      物理: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    };
    return colors[subject] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-white">学习记录</h3>
        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
          查看全部
        </button>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
              {record.date.slice(5)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSubjectColor(record.subject)}`}>
                  {record.subject}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {record.content}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {record.studentName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(record.duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-xl font-bold ${getScoreColor(record.score)}`}>
                  {record.score}
                </p>
                <p className="text-xs text-gray-400">得分</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};