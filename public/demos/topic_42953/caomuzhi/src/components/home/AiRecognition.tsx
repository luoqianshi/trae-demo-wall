import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, X, Leaf, RefreshCw, AlertTriangle } from 'lucide-react';
import { mockIdentify, exampleImages, createHistoryItem } from '@/utils/aiMock';
import { useStore } from '@/store/useStore';
import { formatPercent } from '@/utils/helpers';
import Card from '@/components/common/Card';
import SafeImage from '@/components/common/SafeImage';

const AiRecognition = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loadingText, setLoadingText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { addHistory, isLoggedIn } = useStore();

  const loadingTexts = [
    '正在分析植物特征...',
    '比对草木数据库...',
    '生成识别结果...'
  ];

  useEffect(() => {
    if (isIdentifying) {
      let index = 0;
      setLoadingText(loadingTexts[0]);
      const interval = setInterval(() => {
        index = (index + 1) % loadingTexts.length;
        setLoadingText(loadingTexts[index]);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isIdentifying]);

  const handleFileUpload = async (file: File | string) => {
    setIsIdentifying(true);
    setResults([]);

    try {
      const result = await mockIdentify(file);
      setResults(result.results);
      
      if (isLoggedIn && result.results.length > 0) {
        const topResult = result.results[0];
        addHistory(createHistoryItem(topResult.plantId, topResult.image, topResult.confidence));
      }
    } catch (error) {
      console.error('识别失败:', error);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        handleFileUpload(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        handleFileUpload(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExampleClick = (example: typeof exampleImages[0]) => {
    setUploadedImage(example.url);
    handleFileUpload(example.fileName);
  };

  const handleResultClick = (plantId: number) => {
    navigate(`/detail/${plantId}`);
  };

  const handleRetry = () => {
    setUploadedImage(null);
    setResults([]);
  };

  return (
    <section id="identify" className="py-20 bg-bg-cream">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Camera className="w-6 h-6 text-plant-green" />
            <h2 className="text-3xl font-bold text-text-dark">拍照识草木</h2>
          </div>
          <p className="text-text-medium max-w-lg mx-auto">
            上传植物照片，AI 将为您识别植物种类并提供详细信息
          </p>
        </div>

        <Card className="max-w-3xl mx-auto p-8">
          {!uploadedImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={handleClick}
              className="border-2 border-dashed border-plant-green/30 rounded-card p-12 text-center cursor-pointer hover:border-plant-green/60 hover:bg-plant-green/5 transition-all duration-300"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-20 h-20 glass rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-plant-green" />
              </div>
              <h3 className="text-xl font-semibold text-text-dark mb-2">
                点击或拖拽上传植物照片
              </h3>
              <p className="text-text-medium mb-6">支持 JPG、PNG 格式</p>
              
              <div className="flex flex-wrap justify-center gap-3">
                {exampleImages.slice(0, 6).map((example) => (
                  <button
                    key={example.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExampleClick(example);
                    }}
                    className="flex flex-col items-center gap-1 p-3 hover:bg-plant-green/5 rounded-lg transition-colors"
                  >
                    <img
                      src={example.url}
                      alt={example.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <span className="text-xs text-text-medium">{example.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="上传的图片"
                  className="w-full h-64 object-cover rounded-card"
                />
                <button
                  onClick={handleRetry}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isIdentifying ? (
                <div className="text-center py-12">
                  <div className="relative inline-block">
                    <Leaf className="w-16 h-16 text-plant-green animate-rotate" />
                    <div className="absolute inset-0 animate-pulse-ring">
                      <Leaf className="w-16 h-16 text-plant-green opacity-30" />
                    </div>
                  </div>
                  <p className="mt-6 text-xl text-text-dark font-medium">{loadingText}</p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-plant-green to-plant-medium animate-shimmer" />
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div>
                  {results[0].confidence < 0.5 && (
                    <div className="flex items-center gap-2 p-3 bg-emphasis-coral/10 text-emphasis-coral rounded-lg mb-4">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm">
                        ⚠️ 本识别结果仅供参考，请勿仅凭识别结果食用或药用
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold text-text-dark mb-4">识别结果</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.map((result, index) => (
                      <button
                        key={result.plantId}
                        onClick={() => handleResultClick(result.plantId)}
                        className={`p-4 rounded-card border-2 transition-all duration-300 hover:shadow-lg ${
                          index === 0
                            ? 'border-accent-amber bg-accent-amber/5'
                            : 'border-transparent bg-bg-beige hover:border-plant-green/20'
                        }`}
                      >
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-accent-amber text-white text-xs rounded-full">
                            推荐
                          </div>
                        )}
                        <div className="relative">
                          <SafeImage
                            src={result.image}
                            alt={result.name}
                            containerClassName="w-full h-32 rounded-lg mb-3"
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                          <div className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center z-10">
                            <span className="text-sm font-bold text-plant-green">
                              {formatPercent(result.confidence)}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-semibold text-text-dark">{result.name}</h4>
                        <p className="text-sm text-text-medium italic">{result.latinName}</p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={handleRetry}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      重新识别
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default AiRecognition;
