import { RecognitionResult, HistoryItem } from '@/types';
import { plantsData, getPlantById } from '@/data/plantsData';
import { getPlantImageUrl } from '@/utils/imageUtils';

interface IdentifyResult {
  results: RecognitionResult[];
  processingTime: number;
  imageHash: string;
}

const keywordMap: Record<string, number> = {
  'ginkgo': 1, 'yinxing': 1, '银杏': 1,
  'rose': 3, 'meigui': 3, '玫瑰': 3,
  'mint': 4, 'bohe': 4, '薄荷': 4,
  'chrysanthemum': 5, 'juhua': 5, '菊花': 5,
  'bamboo': 6, 'zhu': 6, '竹子': 6,
  'osmanthus': 7, 'guihua': 7, '桂花': 7,
  'goji': 8, 'gouqi': 8, '枸杞': 8,
  'peony': 9, 'mudan': 9, '牡丹': 9,
  'pine': 10, 'song': 10, '松树': 10,
  'wutong': 11, '梧桐': 11,
  'maple': 12, 'feng': 12, '枫树': 12,
  'banyan': 13, 'rong': 13, '榕树': 13,
  'camphor': 14, 'zhang': 14, '樟树': 14,
  'willow': 15, 'liu': 15, '柳树': 15,
  'poplar': 16, 'yang': 16, '杨树': 16,
  'locust': 17, 'huai': 17, '槐树': 17,
  'chinese_rose': 18, 'yueji': 18, '月季': 18,
  'azalea': 19, 'dujuan': 19, '杜鹃': 19,
  'jasmine': 20, 'moli': 20, '茉莉': 20,
  'ginseng': 2, 'renshen': 2, '人参': 2,
};

const getRandomConfidence = (rank: number): number => {
  if (rank === 1) return 0.75 + Math.random() * 0.2;
  if (rank === 2) return 0.03 + Math.random() * 0.12;
  return 0.01 + Math.random() * 0.04;
};

const generateImageHash = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const mockIdentify = async (imageFile: File | string): Promise<IdentifyResult> => {
  const processingTime = 1500 + Math.random() * 1500;
  
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  let fileName = typeof imageFile === 'string' ? imageFile : imageFile.name.toLowerCase();
  
  let matchedPlantId: number | null = null;
  for (const [keyword, plantId] of Object.entries(keywordMap)) {
    if (fileName.includes(keyword)) {
      matchedPlantId = plantId;
      break;
    }
  }
  
  const results: RecognitionResult[] = [];
  const usedIds = new Set<number>();
  
  if (matchedPlantId) {
    const plant = getPlantById(matchedPlantId);
    if (plant) {
      results.push({
        plantId: plant.id,
        name: plant.name,
        latinName: plant.latinName,
        confidence: 0.85 + Math.random() * 0.1,
        image: plant.image
      });
      usedIds.add(plant.id);
    }
  } else {
    const randomPlant = plantsData[Math.floor(Math.random() * plantsData.length)];
    results.push({
      plantId: randomPlant.id,
      name: randomPlant.name,
      latinName: randomPlant.latinName,
      confidence: 0.75 + Math.random() * 0.2,
      image: randomPlant.image
    });
    usedIds.add(randomPlant.id);
  }
  
  while (results.length < 3) {
    const randomPlant = plantsData[Math.floor(Math.random() * plantsData.length)];
    if (!usedIds.has(randomPlant.id)) {
      results.push({
        plantId: randomPlant.id,
        name: randomPlant.name,
        latinName: randomPlant.latinName,
        confidence: getRandomConfidence(results.length + 1),
        image: randomPlant.image
      });
      usedIds.add(randomPlant.id);
    }
  }
  
  results.sort((a, b) => b.confidence - a.confidence);
  
  return {
    results,
    processingTime: Math.round(processingTime) / 1000,
    imageHash: generateImageHash()
  };
};

export const createHistoryItem = (plantId: number, image: string, confidence: number): HistoryItem => {
  const plant = getPlantById(plantId);
  return {
    id: Date.now().toString(),
    plantId,
    name: plant?.name || '',
    image,
    confidence,
    identifiedAt: new Date().toISOString()
  };
};

export const getHistory = (userId?: string): HistoryItem[] => {
  try {
    if (userId) {
      const stored = localStorage.getItem(`caomuzhi_history_${userId}`);
      return stored ? JSON.parse(stored) : [];
    }
    const stored = localStorage.getItem('caomuzhi_history_guest');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveHistory = (history: HistoryItem[], userId?: string): void => {
  const key = userId ? `caomuzhi_history_${userId}` : 'caomuzhi_history_guest';
  localStorage.setItem(key, JSON.stringify(history));
};

export const clearHistory = (userId?: string): void => {
  const key = userId ? `caomuzhi_history_${userId}` : 'caomuzhi_history_guest';
  localStorage.removeItem(key);
};

export const exampleImages = [
  { name: '银杏', fileName: 'ginkgo.jpg', url: getPlantImageUrl('ginkgo', 1, 600, 400) },
  { name: '玫瑰', fileName: 'rose.jpg', url: getPlantImageUrl('rose', 1, 600, 400) },
  { name: '薄荷', fileName: 'mint.jpg', url: getPlantImageUrl('mint', 1, 600, 400) },
  { name: '竹子', fileName: 'bamboo.jpg', url: getPlantImageUrl('bamboo', 1, 600, 400) },
  { name: '菊花', fileName: 'chrysanthemum.jpg', url: getPlantImageUrl('chrysanthemum', 1, 600, 400) },
  { name: '蒲公英', fileName: 'dandelion.jpg', url: getPlantImageUrl('dandelion', 1, 600, 400) },
  { name: '桂花', fileName: 'osmanthus.jpg', url: getPlantImageUrl('osmanthus', 1, 600, 400) },
  { name: '松树', fileName: 'pine.jpg', url: getPlantImageUrl('pine', 1, 600, 400) },
];
