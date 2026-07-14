import { useState, useCallback, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { useAppStore } from '@/store';
import type { Product, Order, OrderItem } from '@/types';
import { extractOrderFromText, calculateTotal, generateId } from '@/utils';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const products = useAppStore((state) => state.products);
  const addOrder = useAppStore((state) => state.addOrder);
  const updateARCustomers = useAppStore((state) => state.updateARCustomers);
  const arCustomers = useAppStore((state) => state.arCustomers);
  const user = useAppStore((state) => state.user);

  const processOrder = useCallback((text: string, customerId: string) => {
    const extractedItems = extractOrderFromText(text, products);
    
    if (extractedItems.length === 0) {
      return null;
    }

    const orderItems: OrderItem[] = extractedItems.map((item, index) => {
      const product = products.find(p => p.id === item.productId);
      return {
        id: `${customerId}-${index}`,
        productId: item.productId,
        productName: product?.name || '',
        quantity: item.quantity,
        price: product?.price || 0,
      };
    });

    const customer = arCustomers.find(c => c.id === customerId);
    const totalAmount = calculateTotal(orderItems);

    const newOrder: Order = {
      id: generateId(),
      userId: user?.id || '',
      customerId,
      customerName: customer?.name || '',
      items: orderItems,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    addOrder(newOrder);
    updateARCustomers(arCustomers.map(c => 
      c.id === customerId ? { ...c, order: newOrder } : c
    ));

    return newOrder;
  }, [products, addOrder, updateARCustomers, arCustomers, user]);

  const startListening = useCallback((customerId: string) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        setIsProcessing(true);
        setTimeout(() => {
          processOrder(transcript, customerId);
          setIsProcessing(false);
        }, 500);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [transcript, processOrder]);

  return { isListening, transcript, isProcessing, startListening, processOrder };
};

export const useFaceRecognition = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCustomer, setDetectedCustomer] = useState<string | null>(null);
  const [faces, setFaces] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const customers = useAppStore((state) => state.customers);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    };
    loadModels();
  }, []);

  const startDetection = useCallback(async () => {
    if (!videoRef.current) return;

    setIsDetecting(true);
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;

    const detect = async () => {
      if (!videoRef.current || !isDetecting) return;

      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );
        
        setFaces(detections);
        
        if (detections.length > 0) {
          const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
          setDetectedCustomer(randomCustomer.id);
        } else {
          setDetectedCustomer(null);
        }
      } catch {
        // Ignore errors
      }

      requestAnimationFrame(detect);
    };

    videoRef.current.onloadedmetadata = () => {
      detect();
    };
  }, [isDetecting, customers]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setDetectedCustomer(null);
    setFaces([]);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, []);

  return { isDetecting, detectedCustomer, faces, videoRef, startDetection, stopDetection };
};
