export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export interface ExtractedOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  flavor?: string;
}

export const extractOrderFromText = (text: string, products: { id: string; name: string; price: number; flavors?: { id: string; name: string; priceAdjust?: number }[] }[]): ExtractedOrderItem[] => {
  const orderItems: ExtractedOrderItem[] = [];
  
  const quantityWords = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '两', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const quantityMap: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '两': 2,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  };
  
  const unitWords = ['份', '个', '杯', '碗', '盘', '瓶'];
  
  products.forEach(product => {
    const productNamePattern = product.name.replace(/([()（）])/g, '\\$1');
    
    quantityWords.forEach(word => {
      unitWords.forEach(unit => {
        const pattern = new RegExp(`${word}${unit}${productNamePattern}`, 'gi');
        if (pattern.test(text)) {
          const quantity = quantityMap[word];
          const existingItem = orderItems.find(item => item.productId === product.id);
          if (existingItem) {
            existingItem.quantity += quantity;
          } else {
            orderItems.push({
              productId: product.id,
              productName: product.name,
              quantity,
              price: product.price,
            });
          }
        }
      });
      
      const patternWithoutUnit = new RegExp(`${word}${productNamePattern}`, 'gi');
      if (patternWithoutUnit.test(text)) {
        const quantity = quantityMap[word];
        const existingItem = orderItems.find(item => item.productId === product.id);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          orderItems.push({
            productId: product.id,
            productName: product.name,
            quantity,
            price: product.price,
          });
        }
      }
    });
    
    const simplePattern = new RegExp(productNamePattern, 'gi');
    let match;
    let count = 0;
    
    while ((match = simplePattern.exec(text)) !== null) {
      count++;
    }
    
    if (count > 0) {
      const existingItem = orderItems.find(item => item.productId === product.id);
      if (!existingItem) {
        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price,
        });
      }
    }
    
    if (product.flavors) {
      product.flavors.forEach(flavor => {
        const flavorPattern = new RegExp(`${flavor.name}${productNamePattern}`, 'gi');
        if (flavorPattern.test(text)) {
          const existingItem = orderItems.find(item => item.productId === product.id);
          if (existingItem) {
            existingItem.flavor = flavor.name;
            if (flavor.priceAdjust) {
              existingItem.price = product.price + flavor.priceAdjust;
            }
          }
        }
      });
    }
  });
  
  return orderItems;
};

export const calculateTotal = (items: { price: number; quantity: number }[]): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const categories = ['热菜', '素菜', '饮料', '主食', '甜点'];

export interface VoiceRecognitionResult {
  text: string;
  isFinal: boolean;
}

export const createVoiceRecognizer = (onResult: (result: VoiceRecognitionResult) => void): (() => void) => {
  const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof webkitSpeechRecognition; webkitSpeechRecognition?: typeof webkitSpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof webkitSpeechRecognition }).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onResult({ text: '您的浏览器不支持语音识别', isFinal: true });
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';

  recognition.onresult = (event) => {
    let text = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      text += event.results[i][0].transcript;
    }
    onResult({ text, isFinal: event.results[event.results.length - 1].isFinal });
  };

  recognition.onerror = (event) => {
    console.error('语音识别错误:', event.error);
    if (event.error === 'not-allowed') {
      onResult({ text: '请允许麦克风权限', isFinal: true });
    }
  };

  recognition.start();

  return () => {
    recognition.stop();
  };
};

export const simulateFaceRecognition = (): Promise<{ success: boolean; customerId?: string; customerName?: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const random = Math.random();
      if (random > 0.3) {
        const customers = ['张三', '李四', '王五', '赵六', '孙七'];
        const id = generateId();
        const name = customers[Math.floor(Math.random() * customers.length)];
        resolve({ success: true, customerId: id, customerName: name });
      } else {
        resolve({ success: false });
      }
    }, 1500);
  });
};

export const simulatePayment = (amount: number, totalAmount: number): { success: boolean; paidAmount: number; remainingAmount?: number } => {
  const processedAmount = Math.round(amount * 100) / 100;
  
  if (processedAmount >= totalAmount) {
    return { success: true, paidAmount: totalAmount };
  } else {
    return { 
      success: false, 
      paidAmount: processedAmount, 
      remainingAmount: Math.round((totalAmount - processedAmount) * 100) / 100 
    };
  }
};
