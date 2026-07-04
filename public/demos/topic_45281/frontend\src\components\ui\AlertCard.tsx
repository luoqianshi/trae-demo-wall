import React from 'react';
import { AlertTriangle, AlertCircle, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Warning } from '@/hooks/usePrescriptionWarning';
import { useState } from 'react';

interface AlertCardProps {
  warning: Warning;
  onDismiss?: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ warning, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);

  const getLevelConfig = () => {
    switch (warning.level) {
      case 'high':
        return {
          icon: <AlertTriangle size={22} />,
          gradient: 'from-error to-error-container',
          bg: 'bg-error-container/20',
          border: 'border-error/40',
          textColor: 'text-error',
          label: '高危警告',
          labelBg: 'bg-error',
        };
      case 'medium':
        return {
          icon: <AlertCircle size={22} />,
          gradient: 'from-tertiary to-tertiary-container',
          bg: 'bg-tertiary-container/20',
          border: 'border-tertiary/40',
          textColor: 'text-tertiary',
          label: '中危警告',
          labelBg: 'bg-tertiary',
        };
      case 'low':
        return {
          icon: <Info size={22} />,
          gradient: 'from-primary to-primary-container',
          bg: 'bg-primary-container/20',
          border: 'border-primary/40',
          textColor: 'text-primary',
          label: '提示信息',
          labelBg: 'bg-primary',
        };
    }
  };

  const getTypeLabel = () => {
    switch (warning.type) {
      case 'allergy': return '过敏风险';
      case 'duplicate': return '重复用药';
      case 'dosage': return '剂量超标';
      case 'interaction': return '药物相互作用';
      default: return '其他警告';
    }
  };

  const config = getLevelConfig();

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl overflow-hidden transition-all hover:shadow-md`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-on-primary shrink-0 shadow-sm`}>
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`${config.labelBg} text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                  {config.label}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">{getTypeLabel()}</span>
              </div>
              <p className="font-bold text-on-surface">{warning.drugName}</p>
              <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{warning.message}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-lg hover:bg-surface-container-lowest/50 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-surface-container-lowest/50 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <div className="bg-surface-container-lowest rounded-lg p-4">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">处理建议</p>
              <p className="text-sm text-on-surface leading-relaxed">{warning.suggestion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
