import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, FileText, Pill } from 'lucide-react';
import { doctorWorkstationService } from '@/lib/services';
import HistoryTimeline from '@/components/ui/HistoryTimeline';
import { MedicalRecord, Prescription } from '@/lib/types';

interface PatientHistoryProps {
  patientId: number;
  patientName: string;
}

const PatientHistory: React.FC<PatientHistoryProps> = ({ patientId, patientName }) => {
  const [history, setHistory] = useState<{
    records: MedicalRecord[];
    prescriptions: Prescription[];
    allergies: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'prescriptions'>('records');

  useEffect(() => {
    if (patientId) {
      loadHistory();
    }
  }, [patientId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await doctorWorkstationService.getPatientHistory(patientId);
      setHistory(data);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4">患者历史记录 - {patientName}</h3>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-pink-500" size={32} />
        </div>
      ) : (
        <>
          {history?.allergies && history.allergies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle size={20} />
                <span className="font-bold">过敏史</span>
              </div>
              <p className="text-red-800">{history.allergies.join('、')}</p>
            </div>
          )}

          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`pb-3 px-4 ${
                activeTab === 'records'
                  ? 'border-b-2 border-pink-500 text-pink-600 font-bold'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('records')}
            >
              <FileText size={16} className="inline mr-2" />
              历史病历
            </button>
            <button
              className={`pb-3 px-4 ${
                activeTab === 'prescriptions'
                  ? 'border-b-2 border-pink-500 text-pink-600 font-bold'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('prescriptions')}
            >
              <Pill size={16} className="inline mr-2" />
              历史处方
            </button>
          </div>

          {activeTab === 'records' && history?.records && (
            <HistoryTimeline records={history.records} />
          )}

          {activeTab === 'prescriptions' && history?.prescriptions && (
            <div className="space-y-3">
              {history.prescriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无历史处方记录
                </div>
              ) : (
                history.prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-500">
                        {prescription.createTime ? new Date(prescription.createTime).toLocaleDateString('zh-CN') : '未知日期'}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        ¥{prescription.totalPrice?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      状态: {prescription.status || '未知'}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientHistory;
