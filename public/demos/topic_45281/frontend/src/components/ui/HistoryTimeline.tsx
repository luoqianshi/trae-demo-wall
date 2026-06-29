import React from 'react';
import { Calendar, User, Stethoscope, FileText, ChevronRight } from 'lucide-react';
import { MedicalRecord } from '@/lib/types';

interface HistoryTimelineProps {
  records: MedicalRecord[];
  onRecordClick?: (record: MedicalRecord) => void;
}

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ records, onRecordClick }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-container flex items-center justify-center">
          <FileText size={32} className="text-on-surface-variant/40" />
        </div>
        <p className="text-on-surface-variant font-medium">暂无历史病历记录</p>
        <p className="text-xs text-on-surface-variant/60 mt-1">患者首次就诊后将自动生成病历</p>
      </div>
    );
  }

  const getTypeColor = (index: number) => {
    const colors = [
      { bg: 'bg-primary-fixed', dot: 'bg-primary', line: 'border-primary/30' },
      { bg: 'bg-secondary-fixed', dot: 'bg-secondary', line: 'border-secondary/30' },
      { bg: 'bg-tertiary-fixed', dot: 'bg-tertiary', line: 'border-tertiary/30' },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-0">
      {records.map((record, index) => {
        const colors = getTypeColor(index);
        return (
          <div
            key={record.id}
            className="relative pl-10 pb-8 last:pb-0 group cursor-pointer"
            onClick={() => onRecordClick?.(record)}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${colors.line} ${index === records.length - 1 ? 'h-6' : ''}`} />
            
            <div className={`absolute left-0 top-0 w-5 h-5 -translate-x-[9px] rounded-full ${colors.bg} flex items-center justify-center shadow-sm`}>
              <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 hover:border-primary/30 hover:shadow-md transition-all group-hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <Stethoscope size={20} className={colors.dot.replace('bg-', 'text-')} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {record.createTime ? new Date(record.createTime).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : '未知日期'}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {record.createTime ? new Date(record.createTime).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-on-surface-variant/40 group-hover:text-primary transition-colors" />
              </div>

              <div className="space-y-3">
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">诊断结果</p>
                  <p className="text-sm text-on-surface font-medium">{record.diagnosis || '未填写诊断'}</p>
                </div>

                {record.chiefComplaint && (
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">主诉</p>
                    <p className="text-sm text-on-surface-variant">{record.chiefComplaint}</p>
                  </div>
                )}

                {record.treatmentPlan && (
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">治疗方案</p>
                    <p className="text-sm text-on-surface-variant">{record.treatmentPlan}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HistoryTimeline;
