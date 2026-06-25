import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Image, Video, Plane, Hotel, Ticket, FileText, Sparkles, Loader2 } from 'lucide-react';

interface ImportPanelProps {
  open: boolean;
  onClose: () => void;
}

const fileTypeExamples = [
  { icon: Image, label: '照片', accept: 'image/*', color: 'from-pink-400 to-rose-500' },
  { icon: Video, label: '视频', accept: 'video/*', color: 'from-purple-400 to-fuchsia-500' },
  { icon: Plane, label: '机票截图', accept: 'image/*', color: 'from-blue-400 to-cyan-500' },
  { icon: Hotel, label: '酒店订单', accept: 'image/*,application/pdf', color: 'from-amber-400 to-orange-500' },
  { icon: Ticket, label: '景点门票', accept: 'image/*', color: 'from-emerald-400 to-teal-500' },
  { icon: FileText, label: '行程截图', accept: 'image/*', color: 'from-orange-400 to-amber-500' },
];

const mockFileNames = [
  'IMG_2024-07-15_08-35-12.jpg',
  'IMG_2024-07-15_18-21-44.jpg',
  'VID_2024-07-16_10-12-08.mp4',
  'Flight-GA891-boarding-pass.png',
  'Hotel-Ayana-Resort-booking.pdf',
  'IMG_2024-07-18_18-21-33.jpg',
  'IMG_2024-07-18_18-21-34.jpg',
  'IMG_2024-07-18_18-21-35.jpg',
  'IMG_2024-07-19_sunrise.jpg',
  'Ticket-Ubud-Palace.png',
  'Itinerary-7days.pdf',
  'IMG_2024-07-20_sunset.jpg',
];

export function ImportPanel({ open, onClose }: ImportPanelProps) {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; size: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    simulateUpload();
  };

  const handleFileSelect = () => {
    simulateUpload();
  };

  const simulateUpload = () => {
    if (importing) return;
    setImporting(true);
    setUploadedFiles([]);

    const files = mockFileNames.map((name) => ({
      name,
      type: name.endsWith('.mp4') ? 'video' : name.endsWith('.pdf') ? 'document' : 'image',
      size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
    }));

    files.forEach((file, idx) => {
      setTimeout(() => {
        setUploadedFiles((prev) => [...prev, file]);
        if (idx === files.length - 1) {
          setTimeout(() => {
            onClose();
            navigate('/processing/bali');
          }, 600);
        }
      }, idx * 120);
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">导入旅行资料</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-4">
            AI 会从你上传的资料中，自动识别时间、地点、人物和事件，整理成完整的旅行档案。
          </p>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {fileTypeExamples.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 border border-gray-100"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                </div>
              );
            })}
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleFileSelect}
            className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-orange-400 bg-orange-50'
                : 'border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            {importing ? (
              <div className="flex flex-col items-center">
                <Loader2 size={36} className="text-orange-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-700">正在上传 {uploadedFiles.length} 个文件...</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-3">
                  <Upload size={24} className="text-white" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  拖拽文件到此处，或点击上传
                </p>
                <p className="text-xs text-gray-500">
                  支持照片、视频、PDF、订单截图等
                </p>
              </>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto space-y-1.5">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-100 rounded-xl text-sm animate-fadeIn"
                >
                  <span className="text-gray-700 truncate flex-1">{file.name}</span>
                  <span className="text-xs text-green-600 ml-2">{file.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={simulateUpload}
            disabled={importing}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-500 text-white font-medium shadow-lg shadow-orange-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>正在准备 AI 分析...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>开始 AI 智能整理</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
