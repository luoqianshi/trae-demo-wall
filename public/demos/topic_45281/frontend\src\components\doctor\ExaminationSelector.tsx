import React, { useState, useEffect } from 'react';
import { Trash2, FlaskConical, Scan } from 'lucide-react';
import { examinationService } from '@/lib/services';
import type { Examination } from '@/lib/types';

export interface ExaminationItem {
  examinationId: number;
  examinationName: string;
  category: 'lab' | 'image';
  price: number;
  quantity: number;
  dept?: string;
  remark?: string;
}

interface ExaminationSelectorProps {
  selectedExaminations: ExaminationItem[];
  onChange: (examinations: ExaminationItem[]) => void;
}

const ExaminationSelector: React.FC<ExaminationSelectorProps> = ({
  selectedExaminations,
  onChange,
}) => {
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [activeTab, setActiveTab] = useState<'lab' | 'image'>('lab');

  useEffect(() => {
    loadExaminations();
  }, []);

  const loadExaminations = async () => {
    try {
      const data = await examinationService.getAll();
      setExaminations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载检查项目失败:', error);
    }
  };

  const handleAddExamination = (exam: Examination) => {
    const exists = selectedExaminations.find((e) => e.examinationId === exam.id);
    if (exists) return;
    onChange([
      ...selectedExaminations,
      {
        examinationId: exam.id,
        examinationName: exam.name,
        category: exam.category,
        price: exam.price,
        quantity: 1,
        dept: exam.dept,
        remark: exam.remark,
      },
    ]);
  };

  const handleRemoveExamination = (examinationId: number) => {
    onChange(selectedExaminations.filter((e) => e.examinationId !== examinationId));
  };

  const handleQuantityChange = (examinationId: number, quantity: number) => {
    if (quantity < 1) return;
    onChange(
      selectedExaminations.map((e) =>
        e.examinationId === examinationId ? { ...e, quantity } : e
      )
    );
  };

  const examTabs = [
    { key: 'lab' as const, label: '化验检查', icon: FlaskConical },
    { key: 'image' as const, label: '影像检查', icon: Scan },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {examTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-headline uppercase tracking-wider transition-all ${
              activeTab === tab.key
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {selectedExaminations.filter((e) => e.category === activeTab).length > 0 && (
        <div className="space-y-2 mb-4">
          {selectedExaminations
            .filter((e) => e.category === activeTab)
            .map((item) => (
              <div
                key={item.examinationId}
                className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20"
              >
                <div className="flex-1">
                  <div className="font-medium text-on-surface">{item.examinationName}</div>
                  <div className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                    <span>¥{item.price.toFixed(2)}/项</span>
                    {item.dept && <span>· {item.dept}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuantityChange(item.examinationId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors flex items-center justify-center"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.examinationId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors flex items-center justify-center"
                      disabled={true}
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm font-bold text-primary min-w-[60px] text-right">
                    ¥{(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleRemoveExamination(item.examinationId)}
                    className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <select
          onChange={(e) => {
            const examId = parseInt(e.target.value);
            if (examId && examinations.length > 0) {
              const exam = examinations.find(ex => ex.id === examId && ex.category === activeTab);
              if (exam) handleAddExamination(exam);
            }
            e.target.value = "";
          }}
          className="flex-1 bg-surface-container-low border border-outline-variant/30 px-3 py-2.5 text-xs font-label focus:outline-none focus:border-primary-container rounded-xl"
          defaultValue=""
        >
          <option value="" disabled>选择{activeTab === 'lab' ? '化验' : '影像'}检查项目...</option>
          {examinations.filter(ex => ex.category === activeTab).map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name} - {exam.dept || ''} - ¥{exam.price}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ExaminationSelector;
