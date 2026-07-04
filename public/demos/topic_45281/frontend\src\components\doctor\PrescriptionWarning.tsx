import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Warning } from '@/hooks/usePrescriptionWarning';
import AlertCard from '@/components/ui/AlertCard';

interface PrescriptionWarningProps {
  warnings: Warning[];
  checking: boolean;
}

const PrescriptionWarning: React.FC<PrescriptionWarningProps> = ({ warnings, checking }) => {
  if (warnings.length === 0 && !checking) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-red-500" size={20} />
        <h3 className="font-bold text-gray-800">处方安全预警</h3>
        {checking && <span className="text-sm text-gray-500">检查中...</span>}
      </div>

      {warnings.length === 0 && !checking && (
        <p className="text-gray-500">处方安全，无风险提示</p>
      )}

      {warnings.map((warning, index) => (
        <AlertCard key={index} warning={warning} />
      ))}
    </div>
  );
};

export default PrescriptionWarning;
